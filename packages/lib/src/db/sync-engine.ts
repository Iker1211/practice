/**
 * Motor de sincronización Offline-First
 * Sincroniza datos entre SQLite local y Supabase usando colas y resolución de conflictos
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LocalDatabaseAdapter } from './local-db-adapter'
import type { Tables } from './types'

export type SyncStatus = 'synced' | 'pending' | 'conflicted'
export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export interface SyncQueueItem {
  id: string
  tableName: string
  operation: SyncOperation
  recordId: string
  data: Record<string, any>
  createdAt: string
  syncedAt?: string
  error?: string
  retryCount: number
}

export interface SyncConflict {
  recordId: string
  tableName: string
  local: Record<string, any>
  remote: Record<string, any>
}

export interface SyncOptions {
  /**
   * Estrategia de resolución de conflictos
   * 'local' = mantener local, 'remote' = descargar remote, 'manual' = esperar resolución manual
   */
  conflictResolution?: 'local' | 'remote' | 'manual'

  /**
   * Máximo número de reintentos automáticos
   */
  maxRetries?: number

  /**
   * Callback para reportar conflictos no resueltos automáticamente
   */
  onConflict?: (conflict: SyncConflict) => Promise<'local' | 'remote'>
}

export class SyncEngine {
  private syncInProgress = false
  private syncInterval: NodeJS.Timeout | null = null
  private currentUserId: string

  constructor(
    private localDb: LocalDatabaseAdapter,
    private remoteDb: SupabaseClient<any>,
    userId: string,
    private options: SyncOptions = {}
  ) {
    this.currentUserId = userId
    if (!userId) {
      throw new Error('SyncEngine requires a valid userId for RLS security validation')
    }
  }

  /**
   * Iniciar sincronización automática periódica
   */
  startAutoSync(intervalMs: number = 5000): void {
    if (this.syncInterval) return

    this.syncInterval = setInterval(() => {
      this.syncAll().catch((error) => {
        console.error('Auto-sync error:', error)
      })
    }, intervalMs)
  }

  /**
   * Detener sincronización automática
   */
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  /**
   * Sincronizar todos los cambios pendientes
   */
  async syncAll(): Promise<void> {
    if (this.syncInProgress) return
    this.syncInProgress = true

    try {
      // Fase 1: Sincronizar cambios locales al servidor
      await this.pushChanges()

      // Fase 2: Traer cambios remotos
      await this.pullChanges()

      // Fase 3: Resolver conflictos
      await this.resolveConflicts()
    } finally {
      this.syncInProgress = false
    }
  }

  /**
   * Grabar un cambio local para sincronizarlo después
   */
  async recordChange(
    tableName: string,
    operation: SyncOperation,
    recordId: string,
    data: Record<string, any>
  ): Promise<void> {
    const id = `${tableName}:${recordId}:${Date.now()}`

    await this.localDb.execute(
      `INSERT INTO _sync_queue (id, table_name, operation, record_id, data, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, tableName, operation, recordId, JSON.stringify(data), new Date().toISOString()]
    )

    // Marcar registro como pending en la tabla local
    await this.localDb.execute(
      `UPDATE ${tableName} SET _sync_status = 'pending' WHERE id = ?`,
      [recordId]
    )
  }

  /**
   * Enviar cambios locales a Supabase
   */
  private async pushChanges(): Promise<void> {
    // Obtener cambios pendientes
    const items = await this.localDb.query<SyncQueueItem>(
      `SELECT * FROM _sync_queue WHERE synced_at IS NULL AND retry_count < ? ORDER BY created_at ASC`,
      [this.options.maxRetries ?? 3]
    )

    for (const item of items) {
      try {
        await this.pushItem(item)
      } catch (error) {
        // Registrar error y incrementar contador de reintentos
        await this.localDb.execute(
          `UPDATE _sync_queue SET error = ?, retry_count = retry_count + 1 WHERE id = ?`,
          [String(error), item.id]
        )
      }
    }
  }

  /**
   * Enviar un item específico a Supabase
   * Con validación de RLS: verifica que el usuario sea propietario
   */
  private async pushItem(item: SyncQueueItem): Promise<void> {
    const { tableName, operation, recordId, data } = item

    // SEGURIDAD: Validar ownership antes de sync
    await this.validateRecordOwnership(tableName, data)

    switch (operation) {
      case 'INSERT':
      case 'UPDATE': {
        const { error } = await (this.remoteDb
          .from(tableName) as any)
          .upsert(data, { onConflict: 'id' })

        if (error) throw error

        // Marcar como synced
        await this.localDb.execute(
          `UPDATE _sync_queue SET synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), item.id]
        )

        // Marcar registro local como synced
        await this.localDb.execute(
          `UPDATE ${tableName} SET _sync_status = 'synced', _last_synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), recordId]
        )
        break
      }

      case 'DELETE': {
        const { error } = await (this.remoteDb
          .from(tableName) as any)
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', recordId)

        if (error) throw error

        await this.localDb.execute(
          `UPDATE _sync_queue SET synced_at = ? WHERE id = ?`,
          [new Date().toISOString(), item.id]
        )
        break
      }
    }
  }

  /**
   * VALIDACIÓN RLS: Verificar que el usuario es propietario del registro
   * Esta validación ocurre ANTES de enviar a Supabase como protección adicional
   */
  private async validateRecordOwnership(
    tableName: string,
    data: Record<string, any>
  ): Promise<void> {
    switch (tableName) {
      case 'ideas':
        // ideas tiene user_id directo
        if (data.user_id && data.user_id !== this.currentUserId) {
          throw new Error(
            `Security validation failed: Cannot sync ideas with different user_id. ` +
            `Expected: ${this.currentUserId}, Got: ${data.user_id}`
          )
        }
        if (!data.user_id) {
          // Forzar user_id al usuario actual si no está presente
          data.user_id = this.currentUserId
        }
        break

      case 'blocks':
        // blocks no tiene user_id, valida a través de idea_id
        if (data.idea_id) {
          const ideaRecords = await this.localDb.query(
            `SELECT user_id FROM ideas WHERE id = ?`,
            [data.idea_id]
          )
          const idea = ideaRecords[0]
          if (idea && idea.user_id !== this.currentUserId) {
            throw new Error(
              `Security validation failed: Cannot sync blocks. Referenced idea not owned by current user.`
            )
          }
        }
        break

      case 'associations':
        // associations ve a través de source_idea_id y target_idea_id
        if (data.source_idea_id || data.target_idea_id) {
          const ideaIds = [data.source_idea_id, data.target_idea_id].filter(Boolean)
          for (const ideaId of ideaIds) {
            const ideaRecords = await this.localDb.query(
              `SELECT user_id FROM ideas WHERE id = ?`,
              [ideaId]
            )
            const idea = ideaRecords[0]
            if (idea && idea.user_id !== this.currentUserId) {
              throw new Error(
                `Security validation failed: Cannot sync associations. Referenced idea not owned by current user.`
              )
            }
          }
        }
        break

      case 'audit_log':
        // audit_log tiene user_id directo
        if (data.user_id && data.user_id !== this.currentUserId) {
          throw new Error(
            `Security validation failed: Cannot sync audit_log for different user`
          )
        }
        if (!data.user_id) {
          data.user_id = this.currentUserId
        }
        break

      default:
        // Unknown table, skip validation
        break
    }
  }

  /**
   * Traer cambios remotos desde Supabase
   * RLS filtra automáticamente - solo recibimos datos del usuario actual
   * Incluye todas las tablas de usuario
   */
  private async pullChanges(): Promise<void> {
    // Obtener timestamp del último sync (o epoch si es primera vez)
    const lastSync = await this.getLastSyncTime()

    // Por cada tabla de usuario, traer cambios recientes
    // RLS automaticamente filtra por user_id para ideas y audit_log
    // Para blocks y associations, RLS filtra via FK relationships
    const tables = ['ideas', 'blocks', 'associations', 'audit_log']

    for (const tableName of tables) {
      try {
        const { data, error } = await (this.remoteDb
          .from(tableName) as any)
          .select('*')
          .is('deleted_at', null)
          .gte('updated_at', lastSync.toISOString())

        if (error) throw error

        // Merge cambios remotos en base de datos local
        for (const record of data || []) {
          // Validación adicional: confirmar que RLS hizo su trabajo
          await this.validateRecordOwnershipAfterPull(tableName, record)
          await this.mergeRemoteRecord(tableName, record)
        }
      } catch (error) {
        console.error(`Error pulling changes from ${tableName}:`, error)
      }
    }

    // Actualizar último sync
    await this.setLastSyncTime(new Date())
  }

  /**
   * Validación POST-RLS: Verificar que Supabase RLS funcionó correctamente
   * Si esta validación falla, significa que RLS tiene un bug
   */
  private async validateRecordOwnershipAfterPull(
    tableName: string,
    data: Record<string, any>
  ): Promise<void> {
    switch (tableName) {
      case 'ideas':
        if (data.user_id !== this.currentUserId) {
          throw new Error(
            `Critical RLS failure: Received idea with mismatched user_id after RLS filter. ` +
            `Expected: ${this.currentUserId}, Got: ${data.user_id}`
          )
        }
        break

      case 'blocks':
        // Validate indirectly via idea
        if (data.idea_id) {
          const ideaRecords = await this.localDb.query(
            `SELECT user_id FROM ideas WHERE id = ?`,
            [data.idea_id]
          )
          const idea = ideaRecords[0]
          if (idea && idea.user_id !== this.currentUserId) {
            throw new Error(
              `Critical RLS failure: Received block referencing non-owned idea`
            )
          }
        }
        break

      case 'associations':
        if (data.source_idea_id || data.target_idea_id) {
          const ideaIds = [data.source_idea_id, data.target_idea_id].filter(Boolean)
          for (const ideaId of ideaIds) {
            const ideaRecords = await this.localDb.query(
              `SELECT user_id FROM ideas WHERE id = ?`,
              [ideaId]
            )
            const idea = ideaRecords[0]
            if (idea && idea.user_id !== this.currentUserId) {
              throw new Error(
                `Critical RLS failure: Received association referencing non-owned idea`
              )
            }
          }
        }
        break

      case 'audit_log':
        if (data.user_id !== this.currentUserId) {
          throw new Error(
            `Critical RLS failure: Received audit_log entry with mismatched user_id`
          )
        }
        break
    }
  }

  /**
   * Merge de un registro remoto con la versión local
   */
  private async mergeRemoteRecord(
    tableName: string,
    remoteRecord: Record<string, any>
  ): Promise<void> {
    const { id } = remoteRecord

    // Obtener versión local
    const localRecords = await this.localDb.query(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [id]
    )

    const localRecord = localRecords[0]

    if (!localRecord) {
      // No existe localmente, insertar
      const columns = Object.keys(remoteRecord)
      const placeholders = columns.map(() => '?').join(', ')
      const values = Object.values(remoteRecord)

      await this.localDb.execute(
        `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      )
      return
    }

    // Comprobar si hay conflicto
    if (localRecord._sync_status === 'pending' && localRecord.updated_at !== remoteRecord.updated_at) {
      // CONFLICTO: ambos lados han modificado el registro
      const conflict: SyncConflict = {
        recordId: id,
        tableName,
        local: localRecord,
        remote: remoteRecord,
      }

      // Resolver conflicto
      const resolution = await this.resolveConflict(conflict)

      if (resolution === 'remote') {
        // Sobrescribir local con remoto
        await this.updateRecord(tableName, remoteRecord)
      }
      // Si 'local', dejar como está
    } else if (remoteRecord.updated_at > localRecord.updated_at) {
      // Remoto es más nuevo, actualizar local
      await this.updateRecord(tableName, remoteRecord)
    }
  }

  /**
   * Actualizar un registro en la base local
   */
  private async updateRecord(
    tableName: string,
    record: Record<string, any>
  ): Promise<void> {
    const { id, ...fields } = record
    const updates = Object.keys(fields)
      .map((k) => `${k} = ?`)
      .join(', ')
    const values = [...Object.values(fields), id]

    await this.localDb.execute(
      `UPDATE ${tableName} SET ${updates}, _sync_status = 'synced' WHERE id = ?`,
      values
    )
  }

  /**
   * Resolver un conflicto de sincronización
   * Con validación RLS: verifica que el registro pertenece al usuario actual
   */
  private async resolveConflict(conflict: SyncConflict): Promise<'local' | 'remote'> {
    // SEGURIDAD: Validar que ambos registros pertenecen al usuario actual
    await this.validateConflictOwnership(conflict)

    const strategy = this.options.conflictResolution ?? 'remote'

    if (strategy === 'local' || strategy === 'remote') {
      return strategy
    }

    // Estrategia manual: llamar callback
    if (this.options.onConflict) {
      return this.options.onConflict(conflict)
    }

    // Por defecto, mantener local
    return 'local'
  }

  /**
   * Validación RLS: Confirmar ownership antes de resolver conflictos
   */
  private async validateConflictOwnership(conflict: SyncConflict): Promise<void> {
    const { tableName, local, remote } = conflict

    switch (tableName) {
      case 'ideas':
        if (local.user_id !== this.currentUserId || remote.user_id !== this.currentUserId) {
          throw new Error(
            `Security: Cannot resolve conflict on idea not owned by current user`
          )
        }
        break

      case 'blocks':
        // Validate via idea_id
        if (local.idea_id) {
          const ideaRecords = await this.localDb.query(
            `SELECT user_id FROM ideas WHERE id = ?`,
            [local.idea_id]
          )
          const idea = ideaRecords[0]
          if (idea && idea.user_id !== this.currentUserId) {
            throw new Error(
              `Security: Cannot resolve conflict on block referencing non-owned idea`
            )
          }
        }
        break

      case 'associations':
        // Validate via both idea references
        if (local.source_idea_id || local.target_idea_id) {
          const ideaIds = [local.source_idea_id, local.target_idea_id].filter(Boolean)
          for (const ideaId of ideaIds) {
            const ideaRecords = await this.localDb.query(
              `SELECT user_id FROM ideas WHERE id = ?`,
              [ideaId]
            )
            const idea = ideaRecords[0]
            if (idea && idea.user_id !== this.currentUserId) {
              throw new Error(
                `Security: Cannot resolve conflict on association referencing non-owned idea`
              )
            }
          }
        }
        break

      case 'audit_log':
        if (local.user_id !== this.currentUserId || remote.user_id !== this.currentUserId) {
          throw new Error(
            `Security: Cannot resolve conflict on audit_log not owned by current user`
          )
        }
        break
    }
  }

  /**
   * Resolver todos los conflictos pendientes
   * Considera todas las tablas de usuario
   */
  private async resolveConflicts(): Promise<void> {
    const tables = ['ideas', 'blocks', 'associations', 'audit_log']

    for (const tableName of tables) {
      try {
        const conflicts = await this.localDb.query<any>(
          `SELECT * FROM ${tableName} WHERE _sync_status = 'conflicted'`
        )

        for (const record of conflicts) {
          // Validar ownership antes de marcar como resuelto
          if (tableName === 'ideas' && record.user_id !== this.currentUserId) {
            console.warn(
              `Security: Skipping conflict resolution for ${tableName} not owned by current user`
            )
            continue
          }

          // El sistema ya ha intentado resolver en merge, marcar como synced
          await this.localDb.execute(
            `UPDATE ${tableName} SET _sync_status = 'synced' WHERE id = ?`,
            [record.id]
          )
        }
      } catch (error) {
        console.debug(`No conflicts to resolve in ${tableName}:`, error)
      }
    }
  }

  /**
   * Obtener último tiempo de sincronización
   * Considera todas las tablas para encontrar el sync timestamp más antiguo
   */
  private async getLastSyncTime(): Promise<Date> {
    const tables = ['ideas', 'blocks', 'associations', 'audit_log']
    let earliestSync = new Date(0) // Epoch

    for (const tableName of tables) {
      try {
        const records = await this.localDb.query<{ last_sync: string }>(
          `SELECT MAX(_last_synced_at) as last_sync FROM ${tableName} WHERE _last_synced_at IS NOT NULL`
        )

        const lastSync = records[0]?.last_sync
        if (lastSync) {
          const syncDate = new Date(lastSync)
          if (syncDate < earliestSync || earliestSync.getTime() === 0) {
            earliestSync = syncDate
          }
        }
      } catch (error) {
        // Table might not have _last_synced_at, skip
        console.debug(`Could not get last sync time from ${tableName}:`, error)
      }
    }

    return earliestSync
  }

  /**
   * Actualizar tiempo de sincronización
   */
  private async setLastSyncTime(date: Date): Promise<void> {
    // Guardar en almacenamiento local o en tabla de metadatos
    // Por ahora, es implícito en el update de cada registro
  }

  /**
   * Obtener estado de sincronización
   */
  async getStatus(): Promise<{
    syncing: boolean
    pendingChanges: number
    conflicts: number
  }> {
    const pending = await this.localDb.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM _sync_queue WHERE synced_at IS NULL`
    )

    const conflicts = await this.localDb.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM ideas WHERE _sync_status = 'conflicted'`
    )

    return {
      syncing: this.syncInProgress,
      pendingChanges: pending[0]?.count ?? 0,
      conflicts: conflicts[0]?.count ?? 0,
    }
  }
}

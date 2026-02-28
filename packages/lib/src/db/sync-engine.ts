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

  constructor(
    private localDb: LocalDatabaseAdapter,
    private remoteDb: SupabaseClient<any>,
    private options: SyncOptions = {}
  ) {}

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
   */
  private async pushItem(item: SyncQueueItem): Promise<void> {
    const { tableName, operation, recordId, data } = item

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
   * Traer cambios remotos desde Supabase
   */
  private async pullChanges(): Promise<void> {
    // Obtener timestamp del último sync (o epoch si es primera vez)
    const lastSync = await this.getLastSyncTime()

    // Por cada tabla de usuario, traer cambios recientes
    const tables = ['ideas'] // Extensible

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
   */
  private async resolveConflict(conflict: SyncConflict): Promise<'local' | 'remote'> {
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
   * Resolver todos los conflictos
   */
  private async resolveConflicts(): Promise<void> {
    const conflicts = await this.localDb.query<any>(
      `SELECT * FROM ideas WHERE _sync_status = 'conflicted'`
    )

    for (const record of conflicts) {
      // El sistema ya ha intentado resolver en merge, marcar como synced
      await this.localDb.execute(
        `UPDATE ideas SET _sync_status = 'synced' WHERE id = ?`,
        [record.id]
      )
    }
  }

  /**
   * Obtener último tiempo de sincronización
   */
  private async getLastSyncTime(): Promise<Date> {
    const records = await this.localDb.query<{ last_sync: string }>(
      `SELECT MAX(_last_synced_at) as last_sync FROM ideas WHERE _last_synced_at IS NOT NULL`
    )

    const lastSync = records[0]?.last_sync
    return lastSync ? new Date(lastSync) : new Date(0)
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

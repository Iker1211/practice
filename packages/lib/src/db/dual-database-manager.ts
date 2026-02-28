/**
 * Database Manager Dual - Coordina SQLite local (offline) y Supabase (remote)
 * Proporciona una interfaz unificada para ambas bases de datos
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LocalDatabaseAdapter } from './local-db-adapter'
import type { Database } from './types'
import { SyncEngine, type SyncOptions } from './sync-engine'

export interface DualDatabaseConfig {
  local: LocalDatabaseAdapter
  remote: SupabaseClient<Database>
  mode?: 'offline-first' | 'remote-first' | 'hybrid'
  syncOptions?: SyncOptions
  autoSync?: boolean
  autoSyncInterval?: number
}

/**
 * Manager dual que coordina operaciones entre SQLite local y Supabase
 *
 * Modos:
 * - offline-first: Lee/escribe en local primero, sincroniza en background
 * - remote-first: Lee/escribe en Supabase, fallback a local si no hay conexión
 * - hybrid: Mezcla inteligente según disponibilidad de red
 */
export class DualDatabaseManager {
  private mode: 'offline-first' | 'remote-first' | 'hybrid'
  private syncEngine: SyncEngine
  private isOnline = true
  private networkListener?: () => void

  constructor(private config: DualDatabaseConfig) {
    this.mode = config.mode ?? 'hybrid'
    this.syncEngine = new SyncEngine(
      config.local,
      config.remote,
      config.syncOptions ?? { conflictResolution: 'remote' }
    )

    if (config.autoSync ?? true) {
      this.syncEngine.startAutoSync(config.autoSyncInterval ?? 5000)
    }

    // Escuchar cambios de conectividad
    this.setupNetworkListener()
  }

  /**
   * Escribir un registro (create/update)
   * En offline-first, escribe en local primero y sincroniza después
   * En remote-first, intenta escribir en remoto
   */
  async write<T extends Record<string, any>>(
    table: string,
    data: T,
    options?: { syncImmediately?: boolean }
  ): Promise<T> {
    const { syncImmediately = false } = options ?? {}

    if (this.mode === 'remote-first' && this.isOnline) {
      // Remote-first: intentar remoto primero
      try {
        const { data: result, error } = await (this.config.remote
          .from(table) as any)
          .upsert(data, { onConflict: 'id' })

        if (error) throw error

        // También escribir en local para caché
        await this.writeLocal(table, data)
        return (result as T[])[0] ?? data
      } catch (error) {
        // Fallback a local
        console.warn(`Remote write failed, falling back to local:`, error)
        await this.writeLocal(table, data)
        await this.syncEngine.recordChange(
          table,
          data.id ? 'UPDATE' : 'INSERT',
          data.id,
          data
        )
        return data
      }
    }

    // Offline-first o no hay conexión
    // Escribir en local
    await this.writeLocal(table, data)

    // Registrar para sincronización
    await this.syncEngine.recordChange(
      table,
      data.id ? 'UPDATE' : 'INSERT',
      data.id,
      data
    )

    // Opcionalmente, sincronizar inmediatamente
    if (syncImmediately && this.isOnline) {
      await this.syncEngine.syncAll().catch(console.error)
    }

    return data
  }

  /**
   * Leer registros con datos locales + remotos
   * En offline-first, lee local (más rápido)
   * En remote-first, lee remoto con fallback a local
   */
  async read<T = any>(
    table: string,
    options?: {
      filters?: Array<{ column: string; op: string; value: any }>
      orderBy?: string
      limit?: number
    }
  ): Promise<T[]> {
    if (this.mode === 'remote-first' && this.isOnline) {
      // Remote-first: leer de Supabase
      try {
        let query = this.config.remote.from(table).select('*') as any

        // Aplicar filtros
        if (options?.filters) {
          for (const filter of options.filters) {
            if (filter.op === 'eq') {
              query = query.eq(filter.column, filter.value)
            } else if (filter.op === 'neq') {
              query = query.neq(filter.column, filter.value)
            }
          }
        }

        // Aplicar soft delete
        query = query.is('deleted_at', null)

        if (options?.orderBy) {
          query = query.order(options.orderBy, { ascending: false })
        }

        if (options?.limit) {
          query = query.limit(options.limit)
        }

        const { data, error } = await query

        if (error) throw error
        return (data ?? []) as T[]
      } catch (error) {
        console.warn('Remote read failed, falling back to local:', error)
        return this.readLocal(table, options)
      }
    }

    // Offline-first o no hay conexión: leer local (más rápido)
    return this.readLocal(table, options)
  }

  /**
   * Eliminar un registro (soft delete)
   */
  async delete(table: string, id: string): Promise<void> {
    const now = new Date().toISOString()

    if (this.mode === 'remote-first' && this.isOnline) {
      try {
        const { error } = await (this.config.remote
          .from(table) as any)
          .update({ deleted_at: now })
          .eq('id', id)

        if (error) throw error

        // También marcar en local
        await this.config.local.execute(
          `UPDATE ${table} SET deleted_at = ?, _sync_status = 'synced' WHERE id = ?`,
          [now, id]
        )
      } catch (error) {
        console.warn('Remote delete failed, falling back to local:', error)
        await this.config.local.execute(
          `UPDATE ${table} SET deleted_at = ?, _sync_status = 'pending' WHERE id = ?`,
          [now, id]
        )
        await this.syncEngine.recordChange(table, 'DELETE', id, { deleted_at: now })
      }
    } else {
      // Offline-first: borrar localmente primero
      await this.config.local.execute(
        `UPDATE ${table} SET deleted_at = ?, _sync_status = 'pending' WHERE id = ?`,
        [now, id]
      )
      await this.syncEngine.recordChange(table, 'DELETE', id, { deleted_at: now })
    }
  }

  /**
   * Obtener estado de sincronización y conexión
   */
  async getStatus(): Promise<{
    mode: string
    isOnline: boolean
    syncing: boolean
    pendingChanges: number
    conflicts: number
  }> {
    const syncStatus = await this.syncEngine.getStatus()

    return {
      mode: this.mode,
      isOnline: this.isOnline,
      ...syncStatus,
    }
  }

  /**
   * Forzar sincronización inmediata
   */
  async syncNow(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Cannot sync: device is offline')
    }
    await this.syncEngine.syncAll()
  }

  /**
   * Destruir el manager y limpiar recursos
   */
  async destroy(): Promise<void> {
    this.syncEngine.stopAutoSync()
    await this.config.local.close()
    if (this.networkListener) {
      // Remover listener de red
      if (typeof window !== 'undefined' && 'removeEventListener' in window) {
        window.removeEventListener('online', this.networkListener)
        window.removeEventListener('offline', this.networkListener)
      }
    }
  }

  /**
   * Escribir en base de datos local
   */
  private async writeLocal(table: string, data: any): Promise<void> {
    const { id, ...fields } = data
    const columns = ['id', ...Object.keys(fields)]
    const placeholders = columns.map(() => '?').join(', ')
    const values = [id, ...Object.values(fields)]

    // Usar INSERT OR REPLACE (upsert)
    await this.config.local.execute(
      `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )
  }

  /**
   * Leer de base de datos local
   */
  private async readLocal<T = any>(
    table: string,
    options?: {
      filters?: Array<{ column: string; op: string; value: any }>
      orderBy?: string
      limit?: number
    }
  ): Promise<T[]> {
    let sql = `SELECT * FROM ${table} WHERE deleted_at IS NULL`

    const params: any[] = []

    // Aplicar filtros
    if (options?.filters) {
      for (const filter of options.filters) {
        if (filter.op === 'eq') {
          sql += ` AND ${filter.column} = ?`
          params.push(filter.value)
        } else if (filter.op === 'neq') {
          sql += ` AND ${filter.column} != ?`
          params.push(filter.value)
        }
      }
    }

    // Ordenar
    if (options?.orderBy) {
      sql += ` ORDER BY ${options.orderBy} DESC`
    }

    // Limitar
    if (options?.limit) {
      sql += ` LIMIT ?`
      params.push(options.limit)
    }

    return (await this.config.local.query(sql, params)) as T[]
  }

  /**
   * Configurar listeners de cambios de red
   */
  private setupNetworkListener(): void {
    if (typeof window === 'undefined' || !('addEventListener' in window)) {
      return // No hay API de red en SSR
    }

    this.networkListener = () => {
      const wasOnline = this.isOnline
      this.isOnline = navigator.onLine ?? true

      if (!wasOnline && this.isOnline) {
        // Volvimos online, sincronizar inmediatamente
        console.log('Back online, syncing changes...')
        this.syncEngine.syncAll().catch(console.error)
      }
    }

    window.addEventListener('online', this.networkListener)
    window.addEventListener('offline', this.networkListener)
  }
}

/**
 * Repository para desacoplamiento con base de datos dual
 * Soporta tanto Supabase como SQLite local
 */

import type { Tables } from './types'
import type { DualDatabaseManager } from './dual-database-manager'
import type { LocalDatabaseAdapter } from './local-db-adapter'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Repository de Ideas con soporte dual
 * Puede usar Supabase, SQLite local, o ambas con sincronización
 */
export class IdeaRepository {
  constructor(private db: DualDatabaseManager | LocalDatabaseAdapter | SupabaseClient<any>) {}

  /**
   * Detectar tipo de base de datos e implementar interfaz apropiada
   */
  private isDualManager(db: any): db is DualDatabaseManager {
    return typeof db.read === 'function' && typeof db.write === 'function'
  }

  private isLocalAdapter(db: any): db is LocalDatabaseAdapter {
    return typeof db.query === 'function' && typeof db.execute === 'function'
  }

  private isSupabaseClient(db: any): db is SupabaseClient<any> {
    return typeof db.from === 'function'
  }

  async create(title: string): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const data = {
      id,
      title,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      version: 1,
    }

    if (this.isDualManager(this.db)) {
      await this.db.write('ideas', data)
    } else if (this.isLocalAdapter(this.db)) {
      await this.writeToLocal(data)
    } else if (this.isSupabaseClient(this.db)) {
      const { error } = await this.db
        .from('ideas')
        .insert(data)

      if (error) throw error
    } else {
      throw new Error('Unknown database type')
    }

    return id
  }

  async getAll(): Promise<Tables<'ideas'>[]> {
    if (this.isDualManager(this.db)) {
      return this.db.read('ideas', { orderBy: 'created_at', limit: 1000 })
    } else if (this.isLocalAdapter(this.db)) {
      return this.db.query(
        'SELECT * FROM ideas WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1000'
      )
    } else if (this.isSupabaseClient(this.db)) {
      const { data, error } = await this.db
        .from('ideas')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error
      return data ?? []
    } else {
      throw new Error('Unknown database type')
    }
  }

  async update(id: string, title: string): Promise<void> {
    const now = new Date().toISOString()

    const data = {
      id,
      title,
      updated_at: now,
    }

    if (this.isDualManager(this.db)) {
      await this.db.write('ideas', data, { syncImmediately: false })
    } else if (this.isLocalAdapter(this.db)) {
      await this.db.execute(
        'UPDATE ideas SET title = ?, updated_at = ?, _sync_status = "pending" WHERE id = ? AND deleted_at IS NULL',
        [title, now, id]
      )
    } else if (this.isSupabaseClient(this.db)) {
      const { error } = await this.db
        .from('ideas')
        .update({ title, updated_at: now })
        .eq('id', id)
        .is('deleted_at', null)

      if (error) throw error
    } else {
      throw new Error('Unknown database type')
    }
  }

  async delete(id: string): Promise<void> {
    if (this.isDualManager(this.db)) {
      await this.db.delete('ideas', id)
    } else if (this.isLocalAdapter(this.db)) {
      const now = new Date().toISOString()
      await this.db.execute(
        'UPDATE ideas SET deleted_at = ?, _sync_status = "pending" WHERE id = ?',
        [now, id]
      )
    } else if (this.isSupabaseClient(this.db)) {
      const { error } = await this.db
        .from('ideas')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
    } else {
      throw new Error('Unknown database type')
    }
  }

  /**
   * Obtener estado de sincronización (si es disponible)
   */
  async getSyncStatus(): Promise<any> {
    if (this.isDualManager(this.db)) {
      return this.db.getStatus()
    }
    return null
  }

  /**
   * Forzar sincronización (si es disponible)
   */
  async sync(): Promise<void> {
    if (this.isDualManager(this.db)) {
      await this.db.syncNow()
    }
  }

  private async writeToLocal(data: any): Promise<void> {
    if (!this.isLocalAdapter(this.db)) return

    const { id, ...fields } = data
    const columns = ['id', ...Object.keys(fields)]
    const placeholders = columns.map(() => '?').join(', ')
    const values = [id, ...Object.values(fields)]

    await this.db.execute(
      `INSERT OR REPLACE INTO ideas (${columns.join(', ')}) VALUES (${placeholders})`,
      values
    )
  }
}

/**
 * Factory para crear el repository apropiado
 */
export function createIdeaRepository(
  db: DualDatabaseManager | LocalDatabaseAdapter | SupabaseClient<any>
): IdeaRepository {
  return new IdeaRepository(db)
}

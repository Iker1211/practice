/**
 * Implementación de SQLite para Capacitor (Android, iOS, Web)
 * Usa @capacitor-community/sqlite para acceso nativo a SQLite
 */

import type { LocalDatabaseAdapter, LocalDatabaseOptions } from './local-db-adapter'
import { LocalDatabaseAdapterError } from './local-db-adapter'

// Importación dinámica para evitar errores en entornos que no tienen Capacitor
let CapacitorSQLite: any

async function getCapacitorSQLite() {
  if (!CapacitorSQLite) {
    try {
      const { CapacitorSQLite: CSQLite } = await import('@capacitor-community/sqlite')
      CapacitorSQLite = CSQLite
    } catch (error) {
      throw new LocalDatabaseAdapterError(
        'CAPACITOR_INIT_FAILED',
        'Capacitor SQLite plugin not available. Make sure to install @capacitor-community/sqlite',
        error as any
      )
    }
  }
  return CapacitorSQLite
}

export interface CapacitorSQLiteAdapterOptions extends LocalDatabaseOptions {
  /**
   * Si true, borra la BD existente y recrea el schema
   */
  reset?: boolean
}

/**
 * Adapter de Capacitor SQLite para Android/iOS
 * Proporciona acceso a SQLite nativo a través del puente Capacitor
 */
export class CapacitorSQLiteAdapter implements LocalDatabaseAdapter {
  private dbName: string
  private inTransaction = false
  private transactionQueries: Array<{ sql: string; params?: any[] }> = []

  constructor(private options: CapacitorSQLiteAdapterOptions = {}) {
    this.dbName = options.dbName || 'ideas.db'
  }

  /**
   * Inicializar la base de datos (crear si no existe)
   */
  async initialize(): Promise<void> {
    const sqlite = await getCapacitorSQLite()

    try {
      // Crear base de datos
      await sqlite.createConnection({
        database: this.dbName,
        version: this.options.version ?? 1,
        encrypted: false,
        mode: 'no-encryption',
      })

      const db = await sqlite.retrieveConnection(this.dbName)

      // Abrir conexión
      await db.open()

      // Si reset, limpiar y recrear
      if (this.options.reset) {
        await this.dropAllTables(db)
      }

      await db.close()
    } catch (error) {
      throw new LocalDatabaseAdapterError(
        'INIT_FAILED',
        `Failed to initialize Capacitor SQLite database: ${error}`,
        error as any
      )
    }
  }

  /**
   * Ejecutar SELECT query
   */
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const sqlite = await getCapacitorSQLite()

    try {
      const db = await sqlite.retrieveConnection(this.dbName)
      await db.open()

      // Usar prepared statements para evitar SQL injection
      const result = await db.query(sql, params)

      await db.close()

      return (result.values || []) as T[]
    } catch (error) {
      throw new LocalDatabaseAdapterError(
        'QUERY_FAILED',
        `Query failed: ${sql}`,
        error as any
      )
    }
  }

  /**
   * Ejecutar INSERT/UPDATE/DELETE
   */
  async execute(sql: string, params?: any[]): Promise<{ changes: number; lastId?: number }> {
    const sqlite = await getCapacitorSQLite()

    // Si estamos en transacción, agregar a la cola
    if (this.inTransaction) {
      this.transactionQueries.push({ sql, params })
      return { changes: 0 }
    }

    try {
      const db = await sqlite.retrieveConnection(this.dbName)
      await db.open()

      await db.run(sql, params)

      // Capacitor SQLite no retorna cambios directamente, necesitamos hacer un workaround
      // Para cambios, ejecutar una query para contar
      const result = await db.query('SELECT changes() as changes')
      const changes = result.values?.[0]?.changes ?? 0

      await db.close()

      return { changes }
    } catch (error) {
      throw new LocalDatabaseAdapterError(
        'EXECUTE_FAILED',
        `Execute failed: ${sql}`,
        error as any
      )
    }
  }

  /**
   * Ejecutar múltiples queries en transacción ACID
   */
  async transaction<T>(
    callback: (adapter: LocalDatabaseAdapter) => Promise<T>
  ): Promise<T> {
    const sqlite = await getCapacitorSQLite()

    try {
      const db = await sqlite.retrieveConnection(this.dbName)
      await db.open()

      // Iniciar transacción
      await db.run('BEGIN TRANSACTION')

      this.inTransaction = true
      this.transactionQueries = []

      try {
        // Ejecutar callback
        const result = await callback(this)

        // Ejecutar todas las queries acumuladas
        for (const { sql, params } of this.transactionQueries) {
          await db.run(sql, params)
        }

        // Commit
        await db.run('COMMIT')
        await db.close()

        return result
      } catch (error) {
        // Rollback en caso de error
        await db.run('ROLLBACK')
        await db.close()
        throw error
      } finally {
        this.inTransaction = false
        this.transactionQueries = []
      }
    } catch (error) {
      throw new LocalDatabaseAdapterError(
        'TRANSACTION_FAILED',
        `Transaction failed: ${error}`,
        error as any
      )
    }
  }

  /**
   * Cerrar conexión
   */
  async close(): Promise<void> {
    const sqlite = await getCapacitorSQLite()

    try {
      await sqlite.closeConnection(this.dbName)
    } catch (error) {
      console.warn('Error closing Capacitor SQLite connection:', error)
    }
  }

  /**
   * Obtener información de la BD
   */
  async getInfo(): Promise<{ dbName: string; version: number; ready: boolean }> {
    const sqlite = await getCapacitorSQLite()

    try {
      const db = await sqlite.retrieveConnection(this.dbName)
      await db.open()

      const result = await db.query('PRAGMA database_list')
      const schemaVersion = await db.query('PRAGMA user_version')

      await db.close()

      return {
        dbName: this.dbName,
        version: schemaVersion.values?.[0]?.user_version ?? 1,
        ready: true,
      }
    } catch (error) {
      return {
        dbName: this.dbName,
        version: 1,
        ready: false,
      }
    }
  }

  /**
   * Eliminar todas las tablas de usuario
   */
  private async dropAllTables(db: any): Promise<void> {
    try {
      const result = await db.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_%'"
      )

      for (const table of result.values || []) {
        await db.run(`DROP TABLE IF EXISTS ${table.name}`)
      }
    } catch (error) {
      console.warn('Error dropping tables:', error)
    }
  }
}

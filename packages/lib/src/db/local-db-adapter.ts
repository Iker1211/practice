/**
 * Adapter genérico para SQLite local
 * Define la interfaz que todas las implementaciones SQLite deben cumplir
 */

export interface LocalDatabaseOptions {
  dbName?: string
  version?: number
  readOnly?: boolean
}

export interface QueryResult<T = any> {
  rows: T[]
  changes?: number
  insertId?: number
}

export interface LocalDatabaseAdapter {
  /**
   * Ejecutar una query SELECT
   */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>

  /**
   * Ejecutar una query INSERT/UPDATE/DELETE
   */
  execute(sql: string, params?: any[]): Promise<{ changes: number; lastId?: number }>

  /**
   * Ejecutar múltiples queries en una transacción
   */
  transaction<T>(
    callback: (adapter: LocalDatabaseAdapter) => Promise<T>
  ): Promise<T>

  /**
   * Cerrar conexión a la base de datos
   */
  close(): Promise<void>

  /**
   * Obtener información de la base de datos
   */
  getInfo(): Promise<{
    dbName: string
    version: number
    size?: number
    ready: boolean
  }>

  /**
   * Exportar base de datos como blob (para backup)
   */
  export?(): Promise<Blob | ArrayBuffer>

  /**
   * Importar base de datos desde blob
   */
  import?(data: Blob | ArrayBuffer): Promise<void>
}

export class LocalDatabaseAdapterError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'LocalDatabaseAdapterError'
  }
}

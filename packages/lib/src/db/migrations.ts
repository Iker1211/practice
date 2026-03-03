/**
 * Sistema de migraciones para SQLite
 * Ejecuta migrations incrementales sin duplicar esquema
 */

export interface Migration {
  version: number
  description: string
  up: (params: { runSQL: (sql: string, params?: any[]) => Promise<any[]> }) => Promise<void>
  down?: (params: { runSQL: (sql: string, params?: any[]) => Promise<any[]> }) => Promise<void>
}

// Tabla de metadatos para rastrear versión actual del schema
export const MIGRATIONS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  description TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_migrations_version ON _migrations(version);
`

/**
 * Obtener la versión actual de migraciones aplicadas
 */
export async function getCurrentSchemaVersion(
  runSQL: (sql: string, params?: any[]) => Promise<any[]>
): Promise<number> {
  try {
    const result = await runSQL(
      'SELECT MAX(version) as max_version FROM _migrations'
    )
    return result?.[0]?.max_version ?? 0
  } catch {
    return 0
  }
}

/**
 * Aplicar todas las migraciones pendientes
 */
export async function applyMigrations(
  runSQL: (sql: string, params?: any[]) => Promise<any[]>,
  migrations: Migration[]
): Promise<void> {
  // Crear tabla de migraciones si no existe
  await runSQL(MIGRATIONS_TABLE_SQL)

  const currentVersion = await getCurrentSchemaVersion(runSQL)

  // Filtrar migraciones no aplicadas
  const pendingMigrations = migrations.filter((m) => m.version > currentVersion)

  if (pendingMigrations.length === 0) {
    return
  }

  // Aplicar cada migración
  for (const migration of pendingMigrations) {
    try {
      await migration.up({ runSQL })
      await runSQL(
        'INSERT INTO _migrations (version, description) VALUES (?, ?)',
        [migration.version, migration.description]
      )
    } catch (error) {
      console.error(`Migration ${migration.version} failed:`, error)
      throw new Error(
        `Failed to apply migration v${migration.version}: ${migration.description}`
      )
    }
  }
}

/**
 * Definir todas las migraciones del proyecto
 */
export const ALL_MIGRATIONS: Migration[] = [
  {
    version: 1,
    description: 'Initial schema: ideas table',
    up: async ({ runSQL }) => {
      await runSQL(`
        CREATE TABLE ideas (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          deleted_at TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          _local_changes TEXT DEFAULT '{}' COMMENT 'JSON con cambios locales pendientes'
        )
      `)
      await runSQL('CREATE INDEX idx_ideas_deleted_at ON ideas(deleted_at)')
      await runSQL('CREATE INDEX idx_ideas_created_at ON ideas(created_at)')
      await runSQL('CREATE INDEX idx_ideas_updated_at ON ideas(updated_at)')
    },
  },
  {
    version: 2,
    description: 'Add sync metadata columns',
    up: async ({ runSQL }) => {
      // Agregar columnas de sincronización sin perder datos
      await runSQL(`
        ALTER TABLE ideas ADD COLUMN _sync_status TEXT DEFAULT 'synced' CHECK(_sync_status IN ('synced', 'pending', 'conflicted'))
      `)
      await runSQL(`
        ALTER TABLE ideas ADD COLUMN _remote_version INTEGER DEFAULT 0
      `)
      await runSQL(`
        ALTER TABLE ideas ADD COLUMN _last_synced_at TEXT
      `)
      await runSQL('CREATE INDEX idx_ideas_sync_status ON ideas(_sync_status)')
    },
  },
  {
    version: 3,
    description: 'Add sync queue table',
    up: async ({ runSQL }) => {
      await runSQL(`
        CREATE TABLE _sync_queue (
          id TEXT PRIMARY KEY,
          table_name TEXT NOT NULL,
          operation TEXT NOT NULL CHECK(operation IN ('INSERT', 'UPDATE', 'DELETE')),
          record_id TEXT NOT NULL,
          data TEXT NOT NULL COMMENT 'JSON con los datos',
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          synced_at TEXT,
          error TEXT,
          retry_count INTEGER DEFAULT 0
        )
      `)
      await runSQL('CREATE INDEX idx_sync_queue_table_name ON _sync_queue(table_name)')
      await runSQL('CREATE INDEX idx_sync_queue_synced_at ON _sync_queue(synced_at)')
      await runSQL('CREATE INDEX idx_sync_queue_created_at ON _sync_queue(created_at)')
    },
  },
]

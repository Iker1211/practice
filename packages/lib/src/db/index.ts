/**
 * Exporta todos los módulos de la capa de base de datos
 */

// Tipos
export type { Database } from './types'

// Schema y Migraciones
export { generateFullSchemaSQL, generateCreateTableSQL, generateCreateIndexesSQL } from './schema-generator'
export type { SchemaColumn, SchemaTable } from './schema-generator'
export { ALL_MIGRATIONS, MIGRATIONS_TABLE_SQL, getCurrentSchemaVersion, applyMigrations } from './migrations'
export type { Migration } from './migrations'

// Adapters
export { LocalDatabaseAdapterError } from './local-db-adapter'
export type { LocalDatabaseAdapter, LocalDatabaseOptions, QueryResult } from './local-db-adapter'

export { CapacitorSQLiteAdapter } from './capacitor-sqlite-adapter'
export type { CapacitorSQLiteAdapterOptions } from './capacitor-sqlite-adapter'

// Sincronización
export { SyncEngine } from './sync-engine'
export type { SyncStatus, SyncOperation, SyncQueueItem, SyncConflict, SyncOptions } from './sync-engine'

// Manager Dual
export { DualDatabaseManager } from './dual-database-manager'
export type { DualDatabaseConfig } from './dual-database-manager'

// Repository
export { IdeaRepository, createIdeaRepository } from './idea-repository'

// Hooks
export { useIdeas } from './use-ideas'
export type { UseIdeasOptions } from './use-ideas'

// Inicialización
export {
  initializeDatabase,
  getDatabaseManager,
  destroyDatabase,
  getDatabaseStatus,
  reinitializeDatabaseForUser,
} from './initialize-database'
export type { InitializeDatabaseOptions } from './initialize-database'

// Data Safety: Backups
export { BackupEngine, createBackupEngine } from './backup-engine'
export type { BackupMetadata, BackupData } from './backup-engine'

// Data Safety: Audit Log
export { AuditLogEngine, createAuditLogEngine } from './audit-log'
export type { AuditLogEntry, AuditOperation } from './audit-log'

// Data Safety: Recovery
export { RecoveryEngine, createRecoveryEngine } from './recovery-engine'
export type { RecoveryResult } from './recovery-engine'

// Data Safety: Manager
export { DataSafetyManager, createDataSafetyManager } from './data-safety-manager'
export type { DataSafetyStatus } from './data-safety-manager'

// Server Actions (Next.js)
export {
  createIdea,
  getAllIdeas,
  updateIdea,
  deleteIdea,
} from './server-actions'

// Supabase
export { createSupabaseClient } from '../supabase'
export { supabaseBrowser } from './client-browser'

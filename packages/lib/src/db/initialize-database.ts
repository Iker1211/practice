/**
 * Inicializador de base de datos para aplicaciones móviles (Capacitor)
 * Configura automáticamente SQLite + Supabase con sincronización
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './types'
import { CapacitorSQLiteAdapter } from './capacitor-sqlite-adapter'
import { DualDatabaseManager } from './dual-database-manager'
import { applyMigrations, ALL_MIGRATIONS } from './migrations'
import type { SyncOptions } from './sync-engine'
import { setCurrentUserContext } from '../auth/db-isolation'

export interface InitializeDatabaseOptions {
  /**
   * Cliente de Supabase inicializado
   */
  supabase: SupabaseClient<Database>

  /**
   * Nombre de la base de datos SQLite
   */
  dbName?: string

  /**
   * Modo de operación
   */
  mode?: 'offline-first' | 'remote-first' | 'hybrid'

  /**
   * Opciones de sincronización
   */
  syncOptions?: SyncOptions

  /**
   * Habilitar sincronización automática
   */
  autoSync?: boolean

  /**
   * Intervalo de sincronización en ms
   */
  autoSyncInterval?: number

  /**
   * Callback de inicialización completada
   */
  onInitialized?: (manager: DualDatabaseManager) => void

  /**
   * Callback de errores
   */
  onError?: (error: Error) => void

  /**
   * Reset de BD (borra los datos existentes y recrea el schema)
   */
  reset?: boolean
}

let globalDatabaseManager: DualDatabaseManager | null = null

/**
 * Inicializar la base de datos dual para Capacitor
 * Debe llamarse una sola vez en el inicio de la aplicación
 */
export async function initializeDatabase(
  options: InitializeDatabaseOptions
): Promise<DualDatabaseManager> {
  try {
    // Si ya está inicializada, retornar la instancia existente
    if (globalDatabaseManager) {
      return globalDatabaseManager
    }

    console.log('Initializing dual database (SQLite + Supabase)...')

    // Crear adaptador de SQLite local
    const localAdapter = new CapacitorSQLiteAdapter({
      dbName: options.dbName ?? 'ideas.db',
      reset: options.reset ?? false,
    })

    // Inicializar Capacitor SQLite
    await localAdapter.initialize()

    // Aplicar migraciones
    await applyMigrations(
      (sql, params) => localAdapter.execute(sql, params).then(() => []),
      ALL_MIGRATIONS
    )

    console.log('Database schema initialized with migrations')

    // Crear manager dual
    globalDatabaseManager = new DualDatabaseManager({
      local: localAdapter,
      remote: options.supabase,
      mode: options.mode ?? 'hybrid',
      syncOptions: options.syncOptions,
      autoSync: options.autoSync ?? true,
      autoSyncInterval: options.autoSyncInterval ?? 5000,
    })

    console.log(`Database initialized in ${options.mode ?? 'hybrid'} mode`)

    // Guardar referencia global para acceso desde React
    if (typeof window !== 'undefined') {
      (window as any).__DATABASE_MANAGER__ = globalDatabaseManager
    }

    options.onInitialized?.(globalDatabaseManager)

    return globalDatabaseManager
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Failed to initialize database:', err)
    options.onError?.(err)
    throw err
  }
}

/**
 * Obtener la instancia global del database manager
 */
export function getDatabaseManager(): DualDatabaseManager {
  if (!globalDatabaseManager) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    )
  }
  return globalDatabaseManager
}

/**
 * Destruir la instancia global (limpieza)
 */
export async function destroyDatabase(): Promise<void> {
  if (globalDatabaseManager) {
    await globalDatabaseManager.destroy()
    globalDatabaseManager = null

    if (typeof window !== 'undefined') {
      delete (window as any).__DATABASE_MANAGER__
    }
  }
}

/**
 * Re-inicializar base de datos para un usuario específico
 * Llamar después de que usuario inicia sesión
 * 
 * Esto es importante para:
 * 1. Actualizar el contexto global con el nuevo user_id
 * 2. Asegurar que todas las queries filtren por ese usuario
 * 3. Resetear el manager si es necesario
 */
export async function reinitializeDatabaseForUser(
  userId: string,
  userEmail: string,
  options?: Omit<InitializeDatabaseOptions, 'reset'>
): Promise<DualDatabaseManager> {
  try {
    // Actualizar contexto de usuario en BD
    // Esto asegura que todos los INSERT/UPDATE/DELETE incluyan user_id
    setCurrentUserContext({
      userId,
      email: userEmail,
    })

    // Si ya existe un manager, puede que sea del mismo usuario o diferente
    // Por ahora, reutilizamos. Si quieres refresh completo, pasa reset: true
    if (globalDatabaseManager) {
      return globalDatabaseManager
    }

    // Si no existe, inicializar normalmente
    return initializeDatabase(options || {})
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Failed to reinitialize database for user:', err)
    throw err
  }
}

/**
 * Obtener estado de la base de datos
 */
export async function getDatabaseStatus() {
  const manager = getDatabaseManager()
  return manager.getStatus()
}

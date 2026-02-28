/**
 * Ejemplo de inicialización para app Android (Capacitor)
 * Coloca este código en apps/mobile/src/main.tsx
 */

import { createSupabaseClient } from '@myapp/lib'
import { initializeDatabase } from '@myapp/lib'

/**
 * Inicializar la base de datos en el punto de entrada de la app
 */
export async function setupDatabase() {
  try {
    // Crear cliente de Supabase
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase credentials not configured, running in offline-only mode')
    }

    const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

    // Inicializar base de datos dual
    await initializeDatabase({
      supabase,
      dbName: 'ideas.db',
      mode: 'offline-first', // Android inicialmente funciona offline-first
      autoSync: true,
      autoSyncInterval: 10000, // Sincronizar cada 10 segundos

      // Estrategia de resolución de conflictos
      syncOptions: {
        conflictResolution: 'remote', // Prioridad remota en conflictos
        maxRetries: 5,
      },

      onInitialized: (manager) => {
        console.log('✅ Database initialized successfully')
        // Aquí puedes hacer things como cargar datos iniciales, etc.
      },

      onError: (error) => {
        console.error('❌ Database initialization failed:', error)
        // Manejar error crítico - quizás mostrar UI de error
      },
    })

    console.log('Database setup completed')
  } catch (error) {
    console.error('Failed to setup database:', error)
    // En producción, mostrar UI de error amigable
  }
}

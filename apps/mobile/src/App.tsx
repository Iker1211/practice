import { useEffect, useState } from 'react'
import {
  AuthProvider,
  useAuth,
  reinitializeDatabaseForUser,
  createSupabaseClient,
} from '@myapp/lib'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@myapp/ui'
import { LoginScreen } from './screens/LoginScreen'
import { SignupScreen } from './screens/SignupScreen'
import { AppContent } from './AppContent'
import type { Database } from '@myapp/lib'

/**
 * Supabase client (inicializar una sola vez)
 */
const supabase = (() => {
  const url = import.meta.env.VITE_SUPABASE_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.warn('⚠️ Supabase not configured, running in offline-only mode')
    return null
  }

  return createSupabaseClient(url, anonKey)
})()

/**
 * Componente para manejar autenticación y routing
 */
function AppAuthContainer() {
  const { user, loading, isInitialized } = useAuth()
  const [showSignup, setShowSignup] = useState(false)
  const [syncing, setSyncing] = useState(false)

  /**
   * Cuando usuario hace login exitoso:
   * 1. Re-inicializar BD con su user_id
   * 2. Volver a AppContent
   */
  const handleLoginSuccess = async () => {
    if (!user) return

    try {
      // Re-inicializar BD para el usuario autenticado
      await reinitializeDatabaseForUser(user.id, user.email, {
        supabase: supabase || undefined,
      })
      // Router/state ya se actualizarán automáticamente
    } catch (err) {
      console.error('Error reinitializing database:', err)
    }
  }

  /**
   * Cuando usuario se registra exitosamente:
   * 1. Re-inicializar BD con su user_id
   * 2. Si eligió sincronizar: llamar syncNow()
   * 3. Volver a AppContent
   */
  const handleSignupSuccess = async (syncExistingIdeas: boolean) => {
    if (!user) return

    try {
      setSyncing(true)

      // Re-inicializar BD para el usuario nuevo
      await reinitializeDatabaseForUser(user.id, user.email, {
        supabase: supabase || undefined,
      })

      // Si usuario eligió sincronizar, hacerlo ahora
      if (syncExistingIdeas) {
        // Optativo: aquí podrías mostrar UI de progreso
        // const { syncNow } = useIdeas() - pero necesitarías pasar el estado
        console.log('🔄 Sincronizando ideas existentes...')
      }
    } catch (err) {
      console.error('Error on signup:', err)
    } finally {
      setSyncing(false)
    }
  }

  // Mientras se está recuperando la sesión, mostrar loading
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    )
  }

  // Si no hay usuario, mostrar auth screens
  if (!user) {
    return (
      <>
        {showSignup ? (
          <SignupScreen
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setShowSignup(false)}
          />
        ) : (
          <LoginScreen
            onLoginSuccess={() => {
              // Handle login success
              handleLoginSuccess()
            }}
          />
        )}
        {/* Botón para alternar entre login y signup */}
        <div className="fixed bottom-4 right-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSignup(!showSignup)}
            className="text-xs"
          >
            {showSignup ? '← Volver a Login' : 'Crear Cuenta →'}
          </Button>
        </div>
      </>
    )
  }

  // Usuario autenticado: mostrar app principal
  return (
    <AppContent
      user={user}
      syncing={syncing}
      onSyncComplete={() => setSyncing(false)}
    />
  )
}

/**
 * Componente raíz de la app
 */
function App() {
  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-900">
        <div className="text-center text-white">
          <h1 className="text-3xl font-bold mb-4">Configuración Incompleta</h1>
          <p className="mb-4">
            Falta configurar variables de entorno de Supabase:
          </p>
          <ul className="text-left inline-block text-sm space-y-2">
            <li>• VITE_SUPABASE_URL</li>
            <li>• VITE_SUPABASE_ANON_KEY</li>
          </ul>
          <p className="mt-4 text-xs text-gray-300">
            Copia .env.example a .env.local y configúralo
          </p>
        </div>
      </div>
    )
  }

  return (
    <AuthProvider
      supabase={supabase}
      options={{
        autoRecoverSession: true,
      }}
    >
      <AppAuthContainer />
    </AuthProvider>
  )
}

export default App


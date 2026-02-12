'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function TestSupabasePage() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test simple: verificar la sesión (no requiere tablas)
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          setStatus('error')
          setError(error.message)
        } else {
          // Si llegamos aquí, Supabase está conectado correctamente
          setStatus('connected')
        }
      } catch (err) {
        setStatus('error')
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="max-w-md p-8 bg-white dark:bg-zinc-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Test Supabase Connection</h1>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              status === 'checking' ? 'bg-yellow-500 animate-pulse' :
              status === 'connected' ? 'bg-green-500' :
              'bg-red-500'
            }`} />
            <span className="font-medium">
              {status === 'checking' ? 'Conectando...' :
               status === 'connected' ? '✅ Conectado a Supabase' :
               '❌ Error de conexión'}
            </span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          )}

          {status === 'connected' && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-800 dark:text-green-200">
                Cliente de Supabase funciona correctamente desde @myapp/lib
              </p>
            </div>
          )}

          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            <p>Este cliente está importado desde:</p>
            <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
              @/lib/supabase (usa createSupabaseClient de @myapp/lib)
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

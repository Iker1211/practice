/**
 * React Context para autenticación
 * Disponible en toda la app mediante AuthProvider
 */

'use client'

import React, { createContext, useCallback, useEffect, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../db/types'
import type {
  AuthUser,
  AuthError,
  AuthState,
  AuthContextType,
  SignUpData,
  SignInData,
  AuthContextOptions,
} from './types'
import { SupabaseAuthService } from './supabase-auth'
import { setCurrentUserContext, clearUserContext, cleanupUserDataOnLogout } from './db-isolation'

/**
 * Crear el contexto (exportar para usar en hook)
 */
export const AuthContext = createContext<AuthContextType | null>(null)

/**
 * Props del provider
 */
export interface AuthProviderProps {
  supabase: SupabaseClient<Database>
  children: React.ReactNode
  options?: AuthContextOptions
  onDatabaseResetRequired?: (userId: string) => Promise<void>
}

/**
 * AuthProvider component
 * Debe envolver la app entera (típicamente en main.tsx o root layout)
 */
export function AuthProvider({
  supabase,
  children,
  options = {},
  onDatabaseResetRequired,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
    isInitialized: false,
  })

  const authServiceRef = React.useRef<SupabaseAuthService | null>(null)

  // Inicializar servicio de auth
  useEffect(() => {
    if (!authServiceRef.current) {
      authServiceRef.current = new SupabaseAuthService(supabase)
    }
  }, [supabase])

  /**
   * Recuperar sesión al montar (restore user if valid token exists)
   */
  const recoverSession = useCallback(async () => {
    if (!authServiceRef.current) return

    try {
      setState((s) => ({ ...s, loading: true }))

      const result = await authServiceRef.current.recoverSession()

      if (result.error) {
        setState((s) => ({
          ...s,
          user: null,
          error: result.error,
          isInitialized: true,
          loading: false,
        }))
        options.onRecoverError?.(result.error)
        clearUserContext()
        return
      }

      if (result.data) {
        setState((s) => ({
          ...s,
          user: result.data,
          error: null,
          isInitialized: true,
          loading: false,
        }))
        // Actualizar contexto global de BD
        setCurrentUserContext({
          userId: result.data.id,
          email: result.data.email,
        })
        options.onUserRecovered?.(result.data)
      } else {
        setState((s) => ({
          ...s,
          user: null,
          error: null,
          isInitialized: true,
          loading: false,
        }))
        clearUserContext()
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState((s) => ({
        ...s,
        error: { code: 'RECOVER_ERROR', message: error.message },
        isInitialized: true,
        loading: false,
      }))
      clearUserContext()
    }
  }, [options])

  // Auto-recover sesión al montar
  useEffect(() => {
    if (options.autoRecoverSession !== false) {
      recoverSession()
    } else {
      setState((s) => ({ ...s, isInitialized: true, loading: false }))
    }
  }, [options.autoRecoverSession, recoverSession])

  /**
   * Sign up
   */
  const signUp = useCallback(
    async (data: SignUpData): Promise<AuthUser | null> => {
      if (!authServiceRef.current) throw new Error('Auth service not initialized')

      setState((s) => ({ ...s, loading: true, error: null }))

      const result = await authServiceRef.current.signUp(data)

      if (result.error) {
        setState((s) => ({
          ...s,
          loading: false,
          error: result.error,
        }))
        throw new Error(result.error.message)
      }

      if (result.data) {
        setState((s) => ({
          ...s,
          user: result.data,
          loading: false,
          error: null,
        }))
        // Actualizar contexto global de BD
        setCurrentUserContext({
          userId: result.data.id,
          email: result.data.email,
        })
        return result.data
      }

      return null
    },
    []
  )

  /**
   * Sign in
   */
  const signIn = useCallback(async (data: SignInData): Promise<AuthUser | null> => {
    if (!authServiceRef.current) throw new Error('Auth service not initialized')

    setState((s) => ({ ...s, loading: true, error: null }))

    const result = await authServiceRef.current.signIn(data)

    if (result.error) {
      setState((s) => ({
        ...s,
        loading: false,
        error: result.error,
      }))
      throw new Error(result.error.message)
    }

    if (result.data) {
      setState((s) => ({
        ...s,
        user: result.data,
        loading: false,
        error: null,
      }))
      // Actualizar contexto global de BD
      setCurrentUserContext({
        userId: result.data.id,
        email: result.data.email,
      })
      return result.data
    }

    return null
  }, [])

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    if (!authServiceRef.current) throw new Error('Auth service not initialized')

    setState((s) => ({ ...s, loading: true }))

    try {
      // Guardar user_id pero aún no hemos actualizado la BD
      const previousUserId = state.user?.id

      const result = await authServiceRef.current.signOut()

      if (result.error) {
        setState((s) => ({
          ...s,
          loading: false,
          error: result.error,
        }))
        throw new Error(result.error.message)
      }

      // Limpiar datos de usuario en BD local (si existe callback)
      if (previousUserId && onDatabaseResetRequired) {
        try {
          await onDatabaseResetRequired(previousUserId)
        } catch (err) {
          console.error('Error cleaning up database on logout:', err)
        }
      }

      setState((s) => ({
        ...s,
        user: null,
        loading: false,
        error: null,
      }))
      clearUserContext()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setState((s) => ({
        ...s,
        error: { code: 'SIGNOUT_ERROR', message: error.message },
        loading: false,
      }))
      throw error
    }
  }, [state.user?.id, onDatabaseResetRequired])

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    recoverSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook para usar auth en cualquier componente
 */
export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

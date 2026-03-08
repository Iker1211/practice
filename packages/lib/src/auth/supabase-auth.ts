/**
 * Servicio de autenticación con Supabase Auth
 * Envuelve la API de Supabase Auth con funciones type-safe
 */

import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '../db/types'
import type { AuthUser, AuthError, SignUpData, SignInData, AuthResult } from './types'

/**
 * Convertir User de Supabase a nuestro tipo AuthUser
 */
function mapSupabaseUserToAuthUser(user: SupabaseUser): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    createdAt: user.created_at,
    emailConfirmedAt: user.email_confirmed_at ?? undefined,
  }
}

/**
 * Convertir errores de Supabase a nuestro formato
 */
function mapSupabaseError(error: any): AuthError {
  // Si es error de Supabase con estructura standard
  if (error?.error?.code) {
    return {
      code: error.error.code,
      message: error.error.message || error.message || 'Unknown error',
    }
  }

  // Si es error con message
  if (error?.message) {
    return {
      code: 'AUTH_ERROR',
      message: error.message,
    }
  }

  // Fallback
  return {
    code: 'UNKNOWN_ERROR',
    message: String(error),
  }
}

/**
 * Servicio de autenticación
 */
export class SupabaseAuthService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Registrar nuevo usuario
   */
  async signUp(data: SignUpData): Promise<AuthResult<AuthUser>> {
    try {
      const { data: authData, error } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
        },
      })

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      if (!authData.user) {
        return {
          error: {
            code: 'NO_USER_CREATED',
            message: 'User was not created',
          },
        }
      }

      return {
        data: mapSupabaseUserToAuthUser(authData.user),
      }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Iniciar sesión
   */
  async signIn(data: SignInData): Promise<AuthResult<AuthUser>> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      if (!authData.user) {
        return {
          error: {
            code: 'NO_USER_FOUND',
            message: 'User not found',
          },
        }
      }

      return {
        data: mapSupabaseUserToAuthUser(authData.user),
      }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Cerrar sesión
   */
  async signOut(): Promise<AuthResult<null>> {
    try {
      const { error } = await this.supabase.auth.signOut()

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      return { data: null }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Recuperar sesión actual desde Supabase
   * Llamar al iniciar la app para restaurar usuario si hay token válido
   */
  async recoverSession(): Promise<AuthResult<AuthUser | null>> {
    try {
      const { data, error } = await this.supabase.auth.getSession()

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      if (!data.session) {
        return { data: null }
      }

      if (!data.session.user) {
        return {
          error: {
            code: 'SESSION_NO_USER',
            message: 'Session exists but no user found',
          },
        }
      }

      return {
        data: mapSupabaseUserToAuthUser(data.session.user),
      }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Cambiar contraseña
   */
  async updatePassword(newPassword: string): Promise<AuthResult<null>> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      return { data: null }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Enviar email de reset de contraseña
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult<null>> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/reset-password` : undefined,
      })

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      return { data: null }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }

  /**
   * Obtener usuario actual sin refetch
   * (Retorna lo que está en la sesión actual)
   */
  async getCurrentUser(): Promise<AuthResult<AuthUser | null>> {
    try {
      const { data, error } = await this.supabase.auth.getUser()

      if (error) {
        return { error: mapSupabaseError(error) }
      }

      if (!data.user) {
        return { data: null }
      }

      return {
        data: mapSupabaseUserToAuthUser(data.user),
      }
    } catch (err) {
      return { error: mapSupabaseError(err) }
    }
  }
}

/**
 * Crear instancia del servicio de auth
 */
export function createAuthService(
  supabase: SupabaseClient<Database>
): SupabaseAuthService {
  return new SupabaseAuthService(supabase)
}

/**
 * Exportes centrales del módulo de autenticación
 */

// Tipos
export type {
  AuthUser,
  AuthError,
  AuthResult,
  SignUpData,
  SignInData,
  AuthState,
  AuthContextType,
  AuthContextOptions,
} from './types'

// Servicio
export { SupabaseAuthService, createAuthService } from './supabase-auth'

// Contexto y Hook
export { AuthContext, AuthProvider, useAuth } from './auth-context'
export type { AuthProviderProps } from './auth-context'

// Aislamiento de BD
export {
  setCurrentUserContext,
  getCurrentUserContext,
  clearUserContext,
  validateRecordOwnership,
  addUserIdFilter,
  attachUserIdToRecord,
  cleanupUserDataOnLogout,
  validateSyncQueueOwnership,
} from './db-isolation'
export type { UserDBContext } from './db-isolation'

/**
 * Tipos para el sistema de autenticación
 * Fuente única de verdad para auth en toda la aplicación
 */

/**
 * Usuario autenticado
 */
export interface AuthUser {
  id: string // UUID de Supabase Auth
  email: string
  createdAt: string // ISO timestamp
  emailConfirmedAt?: string
}

/**
 * Error de autenticación
 */
export interface AuthError {
  code: string
  message: string
}

/**
 * Datos para sign up
 */
export interface SignUpData {
  email: string
  password: string
}

/**
 * Datos para sign in
 */
export interface SignInData {
  email: string
  password: string
}

/**
 * Resultado de operación de auth
 */
export interface AuthResult<T> {
  data?: T
  error?: AuthError
}

/**
 * Estado del contexto de autenticación
 */
export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: AuthError | null
  isInitialized: boolean
}

/**
 * Opciones para inicializar auth
 */
export interface AuthContextOptions {
  /**
   * Reintentar recuperar sesión al montar
   */
  autoRecoverSession?: boolean
  /**
   * Ejecutar después que user está recuperado
   */
  onUserRecovered?: (user: AuthUser) => void
  /**
   * Ejecutar si error al recuperar sesión
   */
  onRecoverError?: (error: AuthError) => void
}

/**
 * Tipo del contexto de autenticación
 */
export interface AuthContextType extends AuthState {
  /**
   * Registrar nuevo usuario
   */
  signUp: (data: SignUpData) => Promise<AuthResult<AuthUser>>

  /**
   * Iniciar sesión
   */
  signIn: (data: SignInData) => Promise<AuthResult<AuthUser>>

  /**
   * Cerrar sesión (debe limpiar BD local)
   */
  signOut: () => Promise<AuthResult<null>>

  /**
   * Forzar recuperación de sesión desde Supabase
   */
  recoverSession: () => Promise<AuthResult<AuthUser>>
}

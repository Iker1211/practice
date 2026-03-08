/**
 * Hook para manejo centralizado de validación y errores en forms de auth
 * Reduce duplicación de código entre LoginScreen y SignupScreen
 */

import { useState, useCallback } from 'react'

export interface ValidationError {
  field: string
  message: string
}

export interface FormValidationRules {
  email?: {
    required?: boolean
    pattern?: RegExp
  }
  password?: {
    required?: boolean
    minLength?: number
    pattern?: RegExp
  }
  confirmPassword?: {
    required?: boolean
    matchField?: string
  }
}

export interface UseAuthFormOptions {
  rules?: FormValidationRules
  onValidationError?: (errors: ValidationError[]) => void
}

/**
 * Hook para validación de forms de auth
 */
export function useAuthForm(options: UseAuthFormOptions = {}) {
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const rules = {
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      ...options.rules?.email,
    },
    password: {
      required: true,
      minLength: 8,
      ...options.rules?.password,
    },
    confirmPassword: {
      required: true,
      ...options.rules?.confirmPassword,
    },
  }

  /**
   * Validar email
   */
  const validateEmail = useCallback((email: string): ValidationError | null => {
    const emailRules = rules.email

    if (emailRules.required && !email.trim()) {
      return {
        field: 'email',
        message: 'Email es requerido',
      }
    }

    if (emailRules.pattern && email && !emailRules.pattern.test(email)) {
      return {
        field: 'email',
        message: 'Email no es válido',
      }
    }

    return null
  }, [rules.email])

  /**
   * Validar password
   */
  const validatePassword = useCallback((password: string): ValidationError | null => {
    const passwordRules = rules.password

    if (passwordRules.required && !password.trim()) {
      return {
        field: 'password',
        message: 'Contraseña es requerida',
      }
    }

    if (passwordRules.minLength && password && password.length < passwordRules.minLength) {
      return {
        field: 'password',
        message: `Contraseña debe tener al menos ${passwordRules.minLength} caracteres`,
      }
    }

    if (passwordRules.pattern && password && !passwordRules.pattern.test(password)) {
      return {
        field: 'password',
        message: 'Contraseña no cumple los requisitos',
      }
    }

    return null
  }, [rules.password])

  /**
   * Validar que password y confirmPassword coinciden
   */
  const validatePasswordMatch = useCallback(
    (password: string, confirmPassword: string): ValidationError | null => {
      if (!password || !confirmPassword) {
        return null
      }

      if (password !== confirmPassword) {
        return {
          field: 'confirmPassword',
          message: 'Las contraseñas no coinciden',
        }
      }

      return null
    },
    []
  )

  /**
   * Validar form de login (email + password)
   */
  const validateLogin = useCallback(
    (email: string, password: string): boolean => {
      const errors: ValidationError[] = []

      const emailError = validateEmail(email)
      if (emailError) errors.push(emailError)

      const passwordError = validatePassword(password)
      if (passwordError) errors.push(passwordError)

      setValidationErrors(errors)
      options.onValidationError?.(errors)

      return errors.length === 0
    },
    [validateEmail, validatePassword, options]
  )

  /**
   * Validar form de signup (email + password + confirmPassword)
   */
  const validateSignup = useCallback(
    (email: string, password: string, confirmPassword: string): boolean => {
      const errors: ValidationError[] = []

      const emailError = validateEmail(email)
      if (emailError) errors.push(emailError)

      const passwordError = validatePassword(password)
      if (passwordError) errors.push(passwordError)

      const matchError = validatePasswordMatch(password, confirmPassword)
      if (matchError) errors.push(matchError)

      setValidationErrors(errors)
      options.onValidationError?.(errors)

      return errors.length === 0
    },
    [validateEmail, validatePassword, validatePasswordMatch, options]
  )

  /**
   * Limpiar errores
   */
  const clearErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  /**
   * Obtener error por field
   */
  const getErrorForField = useCallback(
    (field: string): string | null => {
      const error = validationErrors.find((e) => e.field === field)
      return error?.message || null
    },
    [validationErrors]
  )

  /**
   * Indicador visual: hay errores?
   */
  const hasErrors = validationErrors.length > 0

  return {
    validationErrors,
    hasErrors,
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateLogin,
    validateSignup,
    clearErrors,
    getErrorForField,
  }
}

/**
 * Función helper para mapear códigos de error de Supabase a mensajes amigables
 */
export function mapSupabaseAuthErrorToMessage(code: string): string {
  const errorMap: Record<string, string> = {
    'invalid_credentials': 'Email o contraseña incorrectos',
    'user_already_exists': 'Este email ya está registrado',
    'weak_password': 'La contraseña es muy débil',
    'invalid_email_format': 'El formato del email no es válido',
    'email_not_confirmed': 'Debes confirmar tu email primero',
    'session_not_found': 'Sesión expirada, inicia sesión nuevamente',
    'user_not_found': 'Usuario no encontrado',
    'too_many_requests': 'Demasiados intentos. Intenta más tarde',
  }

  return errorMap[code] || 'Algo salió mal, por favor intenta nuevamente'
}

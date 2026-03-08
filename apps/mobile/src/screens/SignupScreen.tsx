/**
 * SignupScreen - Pantalla de registro
 * Incluye el TOGGLE: "¿Sincronizar ideas existentes?"
 */

import { useState } from 'react'
import { useAuth } from '@myapp/lib'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@myapp/ui'
import { useAuthForm, mapSupabaseAuthErrorToMessage } from '../hooks/useAuthForm'

export interface SignupScreenProps {
  onSignupSuccess: (syncExistingIdeas: boolean) => void
  onSwitchToLogin: () => void
}

export function SignupScreen({ onSignupSuccess, onSwitchToLogin }: SignupScreenProps) {
  const { signUp, loading, error: authError } = useAuth()
  const { validateSignup, getErrorForField, clearErrors } = useAuthForm()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [syncExisting, setSyncExisting] = useState(true) // ✅ Toggle para sincronizar
  const [serverError, setServerError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    setServerError(null)

    // Validar form
    if (!validateSignup(email, password, confirmPassword)) {
      return
    }

    try {
      await signUp({ email: email.trim(), password })
      // Notificar que el signup fue exitoso y pasar el flag de sincronización
      onSignupSuccess(syncExisting)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear cuenta'
      setServerError(msg)
    }
  }

  const emailError = getErrorForField('email')
  const passwordError = getErrorForField('password')
  const confirmPasswordError = getErrorForField('confirmPassword')
  const displayError = serverError || (authError ? mapSupabaseAuthErrorToMessage(authError.code) : null)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
          <CardDescription>Únete para comenzar a guardar ideas</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className={emailError ? 'border-red-500' : ''}
              />
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              {!passwordError && <p className="text-xs text-gray-500">Mínimo 8 caracteres</p>}
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmar Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                autoComplete="new-password"
                className={confirmPasswordError ? 'border-red-500' : ''}
              />
              {confirmPasswordError && <p className="text-xs text-red-500">{confirmPasswordError}</p>}
            </div>

            {/* 🎯 TOGGLE: Sincronizar ideas existentes */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncExisting}
                  onChange={(e) => setSyncExisting(e.target.checked)}
                  disabled={loading}
                  className="mt-1 cursor-pointer"
                />
                <div className="space-y-1">
                  <div className="font-medium text-sm">Sincronizar ideas existentes</div>
                  <div className="text-xs text-gray-600">
                    Si tienes ideas guardadas localmente, serán subidas a tu cuenta segura en la nube.
                  </div>
                </div>
              </label>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                {displayError}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:underline"
              disabled={loading}
            >
              Inicia sesión
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Info Box */}
      <div className="mt-4 max-w-sm text-xs text-gray-300 text-center">
        <p>Tus datos están protegidos con encriptación end-to-end.</p>
      </div>
    </div>
  )
}

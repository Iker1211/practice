/**
 * LoginScreen - Pantalla de inicio de sesión
 */

import { useState } from 'react'
import { useAuth } from '@myapp/lib'
import { Button, Input, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@myapp/ui'
import { useAuthForm, mapSupabaseAuthErrorToMessage } from '../hooks/useAuthForm'

export function LoginScreen({ onLoginSuccess }: { onLoginSuccess: () => void }) {
  const { signIn, loading, error: authError } = useAuth()
  const { validateLogin, getErrorForField, clearErrors } = useAuthForm()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [serverError, setServerError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    clearErrors()
    setServerError(null)

    // Validar form
    if (!validateLogin(email, password)) {
      return
    }

    try {
      await signIn({ email: email.trim(), password })
      onLoginSuccess()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al iniciar sesión'
      setServerError(msg)
    }
  }

  const emailError = getErrorForField('email')
  const passwordError = getErrorForField('password')
  const displayError = serverError || (authError ? mapSupabaseAuthErrorToMessage(authError.code) : null)

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Ideas App</CardTitle>
          <CardDescription>Inicia sesión para continuar</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                autoComplete="current-password"
                className={passwordError ? 'border-red-500' : ''}
              />
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
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
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Links */}
          <div className="mt-4 text-center text-sm text-gray-600 space-y-2">
            <p>
              ¿No tienes cuenta?{' '}
              <a href="#signup" className="text-blue-600 hover:underline">
                Crear una aquí
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

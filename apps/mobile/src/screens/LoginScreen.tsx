/**
 * LoginScreen - Usando LoginForm de @myapp/ui (Phase 2)
 * Con estilos correctos y validación integrada
 */

import { useAuth } from '@myapp/lib'
import { AuthLayout, AuthCard, LoginForm } from '@myapp/ui'
import { mapSupabaseAuthErrorToMessage } from '../hooks/useAuthForm'

export function LoginScreen({ 
  onLoginSuccess,
  onSwitchToSignup,
}: { 
  onLoginSuccess: () => void
  onSwitchToSignup?: () => void
}) {
  const { signIn, loading, error: authError } = useAuth()

  const handleSubmit = async (email: string, password: string) => {
    try {
      await signIn({ email: email.trim(), password })
      onLoginSuccess()
    } catch (err) {
      console.error('Login error:', err)
      // Error is handled by useAuth hook, displayed in form
    }
  }

  const displayError = authError 
    ? mapSupabaseAuthErrorToMessage(authError.code)
    : undefined

  return (
    <AuthLayout>
      <AuthCard 
        title="Ideas App" 
        description="Inicia sesión para continuar"
      >
        <LoginForm
          onSubmit={handleSubmit}
          onSignupClick={onSwitchToSignup}
          loading={loading}
          error={displayError}
        />
      </AuthCard>
    </AuthLayout>
  )
}

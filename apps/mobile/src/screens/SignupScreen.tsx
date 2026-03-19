/**
 * SignupScreen - Usando SignupForm de @myapp/ui (Phase 2)
 * Con estilos correctos, validación integrada, y fortaleza de contraseña
 */

import { useState } from 'react'
import { useAuth } from '@myapp/lib'
import { AuthLayout, AuthCard, SignupForm } from '@myapp/ui'
import { mapSupabaseAuthErrorToMessage } from '../hooks/useAuthForm'

export interface SignupScreenProps {
  onSignupSuccess: (syncExistingIdeas: boolean) => void
  onSwitchToLogin: () => void
}

export function SignupScreen({ onSignupSuccess, onSwitchToLogin }: SignupScreenProps) {
  const { signUp, loading, error: authError } = useAuth()
  const [syncExisting, setSyncExisting] = useState(true)

  const handleSubmit = async (email: string, password: string) => {
    try {
      await signUp({ email: email.trim(), password })
      onSignupSuccess(syncExisting)
    } catch (err) {
      console.error('Signup error:', err)
      // Error is handled by useAuth hook, displayed in form
    }
  }

  const displayError = authError 
    ? mapSupabaseAuthErrorToMessage(authError.code)
    : undefined

  return (
    <AuthLayout>
      <AuthCard 
        title="Crear Cuenta" 
        description="Únete para comenzar a guardar ideas"
      >
        <SignupForm
          onSubmit={handleSubmit}
          onLoginClick={onSwitchToLogin}
          loading={loading}
          error={displayError}
          enableDataSync={syncExisting}
          onDataSyncChange={setSyncExisting}
        />
      </AuthCard>
    </AuthLayout>
  )
}

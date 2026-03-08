/**
 * AppContent - Contenido principal de la app después de autenticarse
 */

import { useAuth } from '@myapp/lib'
import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@myapp/ui'
import { useIdeas } from './useIdeas'

export interface AppContentProps {
  user?: any
  syncing?: boolean
  onSyncComplete?: () => void
}

export function AppContent({ user, syncing }: AppContentProps) {
  const { signOut } = useAuth()
  const { ideas, loading, create, remove, pendingChanges } = useIdeas()

  const handleCreateIdea = async () => {
    await create('Nueva idea ' + Date.now())
  }

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {/* Header with user info */}
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Ideas App</h1>
          <p className="text-sm text-gray-500">Logged as: {user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      <div className="max-w-4xl w-full">
        {/* Sync Status */}
        {(syncing || pendingChanges > 0) && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mb-4 text-sm">
            {syncing ? (
              <span>🔄 Sincronizando...</span>
            ) : pendingChanges > 0 ? (
              <span>📡 {pendingChanges} cambios pendientes de sincronizar</span>
            ) : null}
          </div>
        )}

        {/* Create Button */}
        <Button onClick={handleCreateIdea} className="mb-4" disabled={loading || syncing}>
          Crear Idea
        </Button>

        {/* Ideas List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-2"></div>
            <p>Cargando ideas...</p>
          </div>
        ) : ideas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-gray-500">No tienes ideas aún. ¡Crea una!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {ideas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{idea.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(idea.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => remove(idea.id)}
                    variant="destructive"
                    size="sm"
                    disabled={syncing}
                  >
                    ✕
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

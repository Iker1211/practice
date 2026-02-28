/**
 * Ejemplo completo de App Mobile con Database Dual
 * Este es un componente que integra toda la arquitectura
 */

import { ReactNode, useEffect, useState } from 'react'
import { useIdeas } from '@myapp/lib'
import { getDatabaseStatus } from '@myapp/lib'

export interface AppContextType {
  isInitialized: boolean
  isOnline: boolean
  syncing: boolean
  pendingChanges: number
}

/**
 * Componente raíz que usa database dual
 */
export function AppWithDatabase() {
  const [context, setContext] = useState<AppContextType>({
    isInitialized: false,
    isOnline: navigator.onLine ?? true,
    syncing: false,
    pendingChanges: 0,
  })

  // Monitorear conectividad
  useEffect(() => {
    const updateOnlineStatus = () => {
      setContext((prev) => ({
        ...prev,
        isOnline: navigator.onLine ?? true,
      }))
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  return (
    <div className="app">
      <StatusBar context={context} />
      <MainContent />
    </div>
  )
}

/**
 * Barra de estado mostrando sincronización
 */
function StatusBar({ context }: { context: AppContextType }) {
  return (
    <div className="status-bar">
      <div className="status-indicator">
        {context.isOnline ? (
          <span className="badge online">🟢 Online</span>
        ) : (
          <span className="badge offline">🔴 Offline</span>
        )}
      </div>

      {context.syncing && (
        <div className="sync-indicator">
          <span className="spinner" />
          Sincronizando...
        </div>
      )}

      {context.pendingChanges > 0 && (
        <div className="pending-badge">
          {context.pendingChanges} cambios pendientes
        </div>
      )}
    </div>
  )
}

/**
 * Contenido principal con lista de ideas
 */
function MainContent() {
  const { ideas, loading, create, update, remove, syncing, pendingChanges, error } = useIdeas({
    mode: 'offline-first',
    autoSync: true,
    syncInterval: 5000,
    onSyncStatus: (status) => {
      console.log(`Sync status:`, status)
    },
  })

  const [newTitle, setNewTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')

  const handleCreate = async () => {
    if (!newTitle.trim()) return

    try {
      await create(newTitle)
      setNewTitle('')
    } catch (error) {
      console.error('Failed to create idea:', error)
    }
  }

  const handleUpdate = async (id: string) => {
    if (!editingText.trim()) return

    try {
      await update(id, editingText)
      setEditingId(null)
      setEditingText('')
    } catch (error) {
      console.error('Failed to update idea:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Eliminar esta idea?')) {
      try {
        await remove(id)
      } catch (error) {
        console.error('Failed to delete idea:', error)
      }
    }
  }

  if (loading) {
    return <div className="loading">Cargando ideas...</div>
  }

  return (
    <div className="main-content">
      <div className="header">
        <h1>📝 Mis Ideas</h1>
        {pendingChanges > 0 && (
          <div className="sync-status">
            {syncing ? 'Sincronizando...' : `${pendingChanges} pendientes`}
          </div>
        )}
      </div>

      {error && (
        <div className="error-alert">
          ⚠️ Error: {error.message}
        </div>
      )}

      <div className="input-section">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Escribe una nueva idea..."
          onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          disabled={loading}
        />
        <button onClick={handleCreate} disabled={loading || !newTitle.trim()}>
          Crear
        </button>
      </div>

      <div className="ideas-list">
        {ideas.length === 0 ? (
          <div className="empty-state">
            <p>📭 No hay ideas aún</p>
            <p>Crea tu primera idea arriba</p>
          </div>
        ) : (
          ideas.map((idea) => (
            <IdeaItem
              key={idea.id}
              idea={idea}
              isEditing={editingId === idea.id}
              editText={editingText}
              onEdit={(id) => {
                setEditingId(id)
                setEditingText(idea.title)
              }}
              onSave={(id) => handleUpdate(id)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(idea.id)}
              onEditTextChange={setEditingText}
            />
          ))
        )}
      </div>

      <div className="debug-info">
        <details>
          <summary>🔧 Información de Debug</summary>
          <pre>{JSON.stringify({ pendingChanges, syncing }, null, 2)}</pre>
        </details>
      </div>
    </div>
  )
}

/**
 * Componente individual de idea
 */
interface IdeaItemProps {
  idea: any
  isEditing: boolean
  editText: string
  onEdit: (id: string) => void
  onSave: (id: string) => void
  onCancel: () => void
  onDelete: (id: string) => void
  onEditTextChange: (text: string) => void
}

function IdeaItem({
  idea,
  isEditing,
  editText,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditTextChange,
}: IdeaItemProps) {
  const syncStatus = idea._sync_status === 'pending' ? '⏳' : '✓'

  return (
    <div className={`idea-item ${idea._sync_status}`}>
      <div className="idea-content">
        {isEditing ? (
          <textarea
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            placeholder="Editar idea..."
          />
        ) : (
          <div className="idea-text">
            <span className="sync-badge">{syncStatus}</span>
            <span>{idea.title}</span>
          </div>
        )}
      </div>

      <div className="idea-meta">
        <time>{new Date(idea.created_at).toLocaleString()}</time>
      </div>

      <div className="idea-actions">
        {isEditing ? (
          <>
            <button onClick={() => onSave(idea.id)} className="btn-save">
              Guardar
            </button>
            <button onClick={onCancel} className="btn-cancel">
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button onClick={() => onEdit(idea.id)} className="btn-edit">
              Editar
            </button>
            <button onClick={() => onDelete(idea.id)} className="btn-delete">
              Eliminar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Estilos básicos (opcionalmente en archivo CSS separado)
const styles = `
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #fafafb;
  }

  .status-bar {
    display: flex;
    gap: 1rem;
    padding: 0.5rem 1rem;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    align-items: center;
    font-size: 0.875rem;
  }

  .badge {
    padding: 0.25rem 0.75rem;
    border-radius: 9999px;
    font-weight: 500;
  }

  .badge.online {
    background: #dcfce7;
    color: #166534;
  }

  .badge.offline {
    background: #fee2e2;
    color: #991b1b;
  }

  .main-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }

  .input-section {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .input-section input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
  }

  .input-section button {
    padding: 0.75rem 1.5rem;
    background: #7c5cfa;
    color: white;
    border: none;
    border-radius: 0.5rem;
    font-weight: 500;
    cursor: pointer;
  }

  .input-section button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ideas-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .idea-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .idea-item.pending {
    opacity: 0.7;
  }

  .idea-content {
    flex: 1;
  }

  .sync-badge {
    margin-right: 0.5rem;
  }

  .idea-actions {
    display: flex;
    gap: 0.5rem;
  }

  .idea-actions button {
    padding: 0.5rem 1rem;
    border: 1px solid #e5e7eb;
    background: white;
    border-radius: 0.25rem;
    font-size: 0.875rem;
    cursor: pointer;
  }

  .idea-actions .btn-delete {
    color: #dc2626;
    border-color: #fecaca;
  }

  .empty-state {
    text-align: center;
    padding: 2rem;
    color: #6b7280;
  }

  .debug-info {
    margin-top: 2rem;
    padding: 1rem;
    background: #f3f4f6;
    border-radius: 0.5rem;
    font-size: 0.875rem;
  }
`

export default AppWithDatabase

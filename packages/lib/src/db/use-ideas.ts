/**
 * Hook de React mejorado para acceso a base de datos dual
 * Maneja automaticamente Supabase, SQLite local, o sincronización
 */

'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { Tables } from './types'

export interface UseIdeasOptions {
  /**
   * Modo de operación: 'offline-first', 'remote-first', o 'hybrid'
   */
  mode?: 'offline-first' | 'remote-first' | 'hybrid'

  /**
   * Si true, sincronizar automáticamente
   */
  autoSync?: boolean

  /**
   * El intervalo de sincronización automática en ms
   */
  syncInterval?: number

  /**
   * Callback cuando hay cambios de sincronización
   */
  onSyncStatus?: (status: {
    syncing: boolean
    pendingChanges: number
    conflicts: number
  }) => void
}

interface UseIdeasState {
  ideas: Tables<'ideas'>[]
  loading: boolean
  error: Error | null
  syncing: boolean
  pendingChanges: number
  conflicts: number
}

const INITIAL_STATE: UseIdeasState = {
  ideas: [],
  loading: true,
  error: null,
  syncing: false,
  pendingChanges: 0,
  conflicts: 0,
}

/**
 * Hook unificado que soporta ambas implementaciones
 * (Server Actions en Next.js, o DualDatabaseManager en móvil/web)
 */
export function useIdeas(options?: UseIdeasOptions) {
  const [state, setState] = useState<UseIdeasState>(INITIAL_STATE)
  const [repository, setRepository] = useState<any | null>(null)
  const dbRef = useRef<any>(null)

  // Inicializar base de datos al montar
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        // Intenta obtener la instancia del database manager desde context global
        // o crea una nueva instancia si no existe
        if (!dbRef.current) {
          // Aquí iría la lógica de inicialización específica de cada plataforma
          // Por ahora, intentar obtener del window o crear dinámicamente
          const global = typeof window !== 'undefined' ? (window as any) : {}

          if (global.__DATABASE_MANAGER__) {
            dbRef.current = global.__DATABASE_MANAGER__
          }
        }

        if (dbRef.current) {
          const { createIdeaRepository } = await import('./idea-repository')
          const repo = createIdeaRepository(dbRef.current)
          setRepository(repo)
        }
      } catch (error) {
        console.error('Failed to initialize database:', error)
        setState((s) => ({
          ...s,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }))
      }
    }

    initializeDatabase()
  }, [])

  // Cargar ideas
  const refresh = useCallback(async () => {
    if (!repository) return

    try {
      setState((s) => ({ ...s, loading: true, error: null }))
      const ideas = await repository.getAll()
      setState((s) => ({ ...s, ideas, loading: false }))

      // Actualizar estado de sincronización
      const syncStatus = await repository.getSyncStatus()
      if (syncStatus) {
        setState((s) => ({
          ...s,
          syncing: syncStatus.syncing,
          pendingChanges: syncStatus.pendingChanges,
          conflicts: syncStatus.conflicts,
        }))
        options?.onSyncStatus?.(syncStatus)
      }
    } catch (error) {
      setState((s) => ({
        ...s,
        error: error instanceof Error ? error : new Error('Failed to load ideas'),
        loading: false,
      }))
    }
  }, [repository, options])

  // Cargar ideas al inicializar repository
  useEffect(() => {
    refresh()
  }, [refresh])

  // Configurar actualización periódica del estado de sincronización
  useEffect(() => {
    if (!repository || !options?.autoSync) return

    const syncStatusInterval = setInterval(async () => {
      try {
        const syncStatus = await repository.getSyncStatus()
        if (syncStatus) {
          setState((s) => ({
            ...s,
            syncing: syncStatus.syncing,
            pendingChanges: syncStatus.pendingChanges,
            conflicts: syncStatus.conflicts,
          }))
          options?.onSyncStatus?.(syncStatus)
        }
      } catch (error) {
        console.error('Error checking sync status:', error)
      }
    }, options.syncInterval ?? 5000)

    return () => clearInterval(syncStatusInterval)
  }, [repository, options])

  const create = useCallback(
    async (title: string) => {
      if (!repository) throw new Error('Database not initialized')

      try {
        const id = await repository.create(title)
        await refresh()
        return id
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to create idea')
        setState((s) => ({ ...s, error: err }))
        throw err
      }
    },
    [repository, refresh]
  )

  const update = useCallback(
    async (id: string, title: string) => {
      if (!repository) throw new Error('Database not initialized')

      try {
        await repository.update(id, title)
        await refresh()
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to update idea')
        setState((s) => ({ ...s, error: err }))
        throw err
      }
    },
    [repository, refresh]
  )

  const remove = useCallback(
    async (id: string) => {
      if (!repository) throw new Error('Database not initialized')

      try {
        await repository.delete(id)
        await refresh()
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Failed to delete idea')
        setState((s) => ({ ...s, error: err }))
        throw err
      }
    },
    [repository, refresh]
  )

  const sync = useCallback(async () => {
    if (!repository) throw new Error('Database not initialized')

    try {
      setState((s) => ({ ...s, syncing: true }))
      await repository.sync()
      await refresh()
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to sync')
      setState((s) => ({ ...s, error: err, syncing: false }))
      throw err
    }
  }, [repository, refresh])

  return {
    // Estado
    ideas: state.ideas,
    loading: state.loading,
    error: state.error,
    syncing: state.syncing,
    pendingChanges: state.pendingChanges,
    conflicts: state.conflicts,

    // Acciones
    refresh,
    create,
    update,
    remove,
    sync,

    // Debug
    repository,
  }
}

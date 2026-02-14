"use client"

import { useEffect, useState, useCallback } from "react"
import { WebDatabaseAdapter, onDatabaseChange } from "./client"
import { IdeaRepository } from "@myapp/lib/db/repository"
import type { Idea } from "@myapp/lib/db/types"

// Singleton adapter
let adapter: WebDatabaseAdapter | null = null
let ideaRepo: IdeaRepository | null = null

function getAdapter(): WebDatabaseAdapter {
  if (!adapter) {
    adapter = new WebDatabaseAdapter()
  }
  return adapter
}

function getIdeaRepository(): IdeaRepository {
  if (!ideaRepo) {
    ideaRepo = new IdeaRepository(getAdapter())
  }
  return ideaRepo
}

export function useDatabase() {
  const [isReady] = useState(() => typeof window !== "undefined")

  return {
    isReady,
    error: null,
    adapter: getAdapter(),
    ideaRepository: getIdeaRepository(),
  }
}

export function useIdeas() {
  const { isReady, ideaRepository } = useDatabase()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    if (!isReady) return

    try {
      setLoading(true)
      const result = await ideaRepository.getAll()
      setIdeas(result as Idea[])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [isReady, ideaRepository])

  useEffect(() => {
    refresh()

    // Escuchar cambios de otras pestañas
    const unsubscribe = onDatabaseChange(() => {
      console.log("[useIdeas] Refreshing due to change in another tab")
      refresh()
    })

    return unsubscribe
  }, [refresh])

  const create = useCallback(async (title: string) => {
    const id = await ideaRepository.create(title)
    await refresh()
    return id
  }, [ideaRepository, refresh])

  const update = useCallback(async (id: string, title: string) => {
    await ideaRepository.update(id, title)
    await refresh()
  }, [ideaRepository, refresh])

  const remove = useCallback(async (id: string) => {
    await ideaRepository.delete(id)
    await refresh()
  }, [ideaRepository, refresh])

  return {
    ideas,
    loading,
    error,
    refresh,
    create,
    update,
    remove,
  }
}

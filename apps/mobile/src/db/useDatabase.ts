// apps/mobile/src/db/useDatabase.ts
import { useEffect, useState, useCallback } from "react"
import { CapacitorDatabaseAdapter } from "./client"
import { IdeaRepository } from "@myapp/lib/db/repository"
import type { Idea } from "@myapp/lib/db/types"

let adapter: CapacitorDatabaseAdapter | null = null
let ideaRepo: IdeaRepository | null = null

function getAdapter(): CapacitorDatabaseAdapter {
  if (!adapter) adapter = new CapacitorDatabaseAdapter()
  return adapter
}

function getIdeaRepository(): IdeaRepository {
  if (!ideaRepo) ideaRepo = new IdeaRepository(getAdapter())
  return ideaRepo
}

export function useIdeas() {
  const ideaRepository = getIdeaRepository()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await ideaRepository.getAll()
      setIdeas(result as Idea[])
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [ideaRepository])

  useEffect(() => { refresh() }, [refresh])

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

  return { ideas, loading, error, refresh, create, update, remove }
}
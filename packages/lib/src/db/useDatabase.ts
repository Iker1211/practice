"use client"

import { useEffect, useState, useCallback } from "react"
import type { Tables } from './types'

// Intenta usar Server Actions si está disponible (Next.js)
// Si no, usa el cliente del navegador (Vite/mobile)
let getAllIdeasFn: (() => Promise<Tables<'ideas'>[]>) | undefined
let createIdeaFn: ((title: string) => Promise<string>) | undefined
let updateIdeaFn: ((id: string, title: string) => Promise<void>) | undefined
let deleteIdeaFn: ((id: string) => Promise<void>) | undefined

// Detectar si estamos en Next.js
const isNextJs = typeof window === 'undefined' || (typeof window !== 'undefined' && !!(window as any).__NEXT_DATA__)

if (isNextJs) {
  // Importar Server Actions si estamos en Next.js
  try {
    const serverActions = require('./server-actions')
    getAllIdeasFn = serverActions.getAllIdeas
    createIdeaFn = serverActions.createIdea
    updateIdeaFn = serverActions.updateIdea
    deleteIdeaFn = serverActions.deleteIdea
  } catch (e) {
    // Server Actions no disponibles
  }
}

// Fallback para Vite/navegador - usar cliente de Supabase directamente
if (!getAllIdeasFn) {
  const { supabaseBrowser } = require('./client-browser')
  
  getAllIdeasFn = async () => {
    const { data, error } = await supabaseBrowser
      .from('ideas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  createIdeaFn = async (title: string) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error } = await supabaseBrowser.from('ideas').insert({
      id,
      title,
      created_at: now,
      updated_at: now,
    })

    if (error) throw error
    return id
  }

  updateIdeaFn = async (id: string, title: string) => {
    const now = new Date().toISOString()

    const { error } = await supabaseBrowser
      .from('ideas')
      .update({ title, updated_at: now })
      .eq('id', id)

    if (error) throw error
  }

  deleteIdeaFn = async (id: string) => {
    const now = new Date().toISOString()

    const { error } = await supabaseBrowser
      .from('ideas')
      .update({ deleted_at: now })
      .eq('id', id)

    if (error) throw error
  }
}

export function useIdeas() {
  const [ideas, setIdeas] = useState<Tables<'ideas'>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getAllIdeasFn!()
      setIdeas(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const create = useCallback(async (title: string) => {
    const id = await createIdeaFn!(title)
    await refresh()
    return id
  }, [refresh])

  const update = useCallback(async (id: string, title: string) => {
    await updateIdeaFn!(id, title)
    await refresh()
  }, [refresh])

  const remove = useCallback(async (id: string) => {
    await deleteIdeaFn!(id)
    await refresh()
  }, [refresh])

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

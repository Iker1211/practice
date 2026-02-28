'use server'

import { supabase } from './client'
import type { Tables } from './types'

export async function createIdea(title: string): Promise<string> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()

  const { error } = await (supabase.from('ideas') as any).insert({
    id,
    title,
    created_at: now,
    updated_at: now,
  })

  if (error) throw error

  return id
}

export async function getAllIdeas(): Promise<Tables<'ideas'>[]> {
  const { data, error } = await (supabase
    .from('ideas') as any)
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data || []
}

export async function updateIdea(id: string, title: string): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await (supabase
    .from('ideas') as any)
    .update({ title, updated_at: now })
    .eq('id', id)

  if (error) throw error
}

export async function deleteIdea(id: string): Promise<void> {
  const now = new Date().toISOString()

  const { error } = await (supabase
    .from('ideas') as any)
    .update({ deleted_at: now })
    .eq('id', id)

  if (error) throw error
}

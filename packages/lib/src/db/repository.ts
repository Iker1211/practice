import { supabase } from './client'
import type { Tables } from './types'

export const ideaRepository = {
  async create(title: string): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const { error } = await supabase.from('ideas').insert({
      id,
      title,
      created_at: now,
      updated_at: now,
    })

    if (error) throw error

    return id
  },

  async getAll(): Promise<Tables<'ideas'>[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data ?? []
  },

  async update(id: string, title: string): Promise<void> {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('ideas')
      .update({
        title,
        updated_at: now,
      })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) throw error
  },

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString()

    const { error } = await supabase
      .from('ideas')
      .update({
        deleted_at: now,
      })
      .eq('id', id)

    if (error) throw error
  },
}

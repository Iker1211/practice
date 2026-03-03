/* @ts-nocheck */
/**
 * Repository para operaciones CRUD en tabla 'ideas'
 * 
 * NOTE: Uses @ts-nocheck due to Supabase.js type inference limitations
 * with generics. At runtime, types are enforced by the database schema.
 * This is a known issue with @supabase/supabase-js and TS strict mode.
 */
import { supabase } from './client'
import type { Database } from './types'

type Ideas = Database['public']['Tables']['ideas']

export const ideaRepository = {
  async create(title: string): Promise<string> {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    // PRAGMATIC: Supabase type inference issues require assertion
    // @ts-ignore - Types should match at runtime
    const { error } = await supabase.from('ideas').insert({
      id,
      title,
      created_at: now,
      updated_at: now,
    })

    if (error) throw error

    return id
  },

  async getAll(): Promise<Ideas['Row'][]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error

    return (data ?? []) as Ideas['Row'][]
  },

  async update(id: string, title: string): Promise<void> {
    const now = new Date().toISOString()

    const response = await ((supabase.from('ideas') as any)
      .update({
        title,
        updated_at: now,
      })
      .eq('id', id)
      .is('deleted_at', null))

    if (response?.error) throw new Error(response.error?.message || 'Update failed')
  },

  async delete(id: string): Promise<void> {
    const now = new Date().toISOString()

    const response = await ((supabase.from('ideas') as any)
      .update({
        deleted_at: now,
      })
      .eq('id', id))

    if (response?.error) throw new Error(response.error?.message || 'Delete failed')
  },
}

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './db/types'

// Función helper para crear el cliente (cada app la llama con sus env vars)
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {  
  return createClient(url, anonKey)
}

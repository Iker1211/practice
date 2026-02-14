import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Tipo del cliente para usar en las apps
export type Database = any // Aquí puedes agregar tus tipos generados después

// Función helper para crear el cliente (cada app la llama con sus env vars)
export function createSupabaseClient(url: string, anonKey: string): SupabaseClient<Database> {  
  return createClient(url, anonKey)
}

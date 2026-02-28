import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// biome-ignore lint/suspicious/noShadowRestrictedNames: <explanation>
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required')
if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required')

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
})

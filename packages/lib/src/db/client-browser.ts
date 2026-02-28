import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

// Para ambiente del navegador (Vite, mobile, Next.js cliente)
// Intenta obtener las variables en este orden:
// 1. NEXT_PUBLIC_ de Next.js (disponible via process.env en build o global window)
// 2. VITE_ de Vite (disponible via import.meta.env en Vite)
// 3. Variables globales del window

let SUPABASE_URL =  typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL
const fallbackUrl = typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_URL : undefined
if (!SUPABASE_URL) {
  SUPABASE_URL = fallbackUrl
  // Si Vite, intenta desde import.meta.env (tipo-seguro)
  if (typeof SUPABASE_URL === 'undefined' && typeof globalThis !== 'undefined') {
    try {
      const meta = (globalThis as any).import?.meta?.env
      if (meta?.VITE_SUPABASE_URL) {
        SUPABASE_URL = meta.VITE_SUPABASE_URL
      }
    } catch {}
  }
}

let SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
const fallbackKey = typeof window !== 'undefined' ? (window as any).NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined
if (!SUPABASE_ANON_KEY) {
  SUPABASE_ANON_KEY = fallbackKey
  // Si Vite, intenta desde import.meta.env
  if (typeof SUPABASE_ANON_KEY === 'undefined' && typeof globalThis !== 'undefined') {
    try {
      const meta = (globalThis as any).import?.meta?.env
      if (meta?.VITE_SUPABASE_ANON_KEY) {
        SUPABASE_ANON_KEY = meta.VITE_SUPABASE_ANON_KEY
      }
    } catch {}
  }
}

if (!SUPABASE_URL) throw new Error('SUPABASE_URL is required')
if (!SUPABASE_ANON_KEY) throw new Error('SUPABASE_ANON_KEY is required')

export const supabaseBrowser = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
})

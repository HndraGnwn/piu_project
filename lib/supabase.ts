import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// Supabase now issues "publishable" keys (sb_publishable_...) in place of the
// older "anon" JWT keys. Accept either so existing setups keep working.
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * True only when both public Supabase env vars are present.
 * Used to render a setup notice instead of crashing the app.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

/**
 * Lazily created client. It is `null` when the env vars are missing so that
 * importing this module never throws during module evaluation.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createBrowserClient(supabaseUrl as string, supabaseKey as string)
  : null

export const SUPABASE_SETUP_MESSAGE =
  'Supabase belum terhubung. Tambahkan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY pada Environment Variables project ini.'

/** Use inside handlers where a configured client is required. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(SUPABASE_SETUP_MESSAGE)
  return supabase
}

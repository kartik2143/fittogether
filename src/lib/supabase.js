import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your values.')
}

// Browser fetch has no default timeout, so on a weak gym/mobile signal a
// request can open a connection and then stall forever — the await never
// resolves, leaving the UI stuck in a permanent loading state. Wrap fetch
// with an AbortController so a stalled request fails cleanly after a ceiling,
// turning an infinite spinner into a normal "couldn't save, try again" error.
const REQUEST_TIMEOUT_MS = 15000

function fetchWithTimeout(input, init = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  // Honour any caller-supplied abort signal alongside our own timeout.
  if (init.signal) {
    if (init.signal.aborted) controller.abort()
    else init.signal.addEventListener('abort', () => controller.abort(), { once: true })
  }

  return fetch(input, { ...init, signal: controller.signal })
    .finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
})

import { createServerClient as _createServerClient } from '@supabase/ssr'
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { getSupabaseConfig } from './utils'

export const createClient = (cookieStore: ReadonlyRequestCookies) => {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig()
  return _createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
    },
  })
} 
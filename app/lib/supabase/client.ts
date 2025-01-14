'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Create a singleton instance for client-side usage
export const supabase = createClient() 
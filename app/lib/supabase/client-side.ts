'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database/database.types'

export function createClientComponentClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
} 
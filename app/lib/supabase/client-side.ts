/**
 * Supabase Client-Side Module
 * Last Updated: 2025-03-19
 * 
 * Provides client-side Supabase instance with proper typing.
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from './database.types'

export const createClient = () => {
  return createClientComponentClient<Database>()
}

export default createClient 
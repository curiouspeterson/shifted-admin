/**
 * Supabase Server Utilities
 * Last Updated: 2024-03
 * 
 * This file provides server-side utilities for Supabase integration.
 * It includes functions for creating server clients, handling cookies,
 * and performing server-side operations.
 */

import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import type { 
  PostgrestError, 
  AuthError,
  SupabaseClient 
} from '@supabase/supabase-js'
import type { Database } from './database.types'

type Client = ReturnType<typeof createClient>

/**
 * Custom error class for Supabase operations
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly cause?: PostgrestError | AuthError | null
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

/**
 * Creates a Supabase server client with cookie handling
 */
export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.delete({ name, ...options })
        },
      },
    }
  )
}

/**
 * Verifies user authentication on the server side
 * @throws {DatabaseError} If user is not authenticated
 */
export async function verifyAuth() {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    throw new DatabaseError('Authentication error', error)
  }

  if (!session) {
    throw new DatabaseError('Not authenticated')
  }

  return session
}

/**
 * Performs a server-side database query with error handling
 */
export async function executeQuery<T>(
  queryFn: (client: Client) => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const supabase = createClient()
  const { data, error } = await queryFn(supabase)

  if (error) {
    throw new DatabaseError('Database query failed', error)
  }

  if (!data) {
    throw new DatabaseError('No data returned')
  }

  return data
}

/**
 * Fetches data from a table with type safety and error handling
 */
export async function fetchTableData<
  TableName extends keyof Database['public']['Tables']
>(
  table: TableName,
  query?: (
    client: Client
  ) => ReturnType<Client['from']>
) {
  return executeQuery(async (supabase) => {
    let queryBuilder = supabase.from(table)

    if (query) {
      queryBuilder = query(supabase)
    }

    return queryBuilder.select('*')
  })
} 
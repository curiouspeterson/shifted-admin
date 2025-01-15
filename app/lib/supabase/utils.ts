/**
 * Supabase Utility Functions
 * Last Updated: 2024-03
 * 
 * This file provides utility functions for common Supabase operations.
 * It includes authentication helpers, error handling, and data transformation.
 */

import { createServerClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

/**
 * Error class for Supabase-related errors
 */
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: unknown
  ) {
    super(message)
    this.name = 'SupabaseError'
  }
}

/**
 * Creates a server-side Supabase client with error handling
 */
export function createServerClientSafe() {
  if (!process.env.SUPABASE_URL) {
    throw new SupabaseError(
      'Missing SUPABASE_URL environment variable',
      'CONFIG_ERROR'
    )
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new SupabaseError(
      'Missing SUPABASE_SERVICE_ROLE_KEY environment variable',
      'CONFIG_ERROR'
    )
  }

  try {
    const cookieStore = cookies()
    return createServerClient<Database>(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options })
            } catch (error) {
              console.error('Error setting cookie:', error)
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options })
            } catch (error) {
              console.error('Error removing cookie:', error)
            }
          },
        },
      }
    )
  } catch (error) {
    throw new SupabaseError(
      'Failed to create Supabase client',
      'CLIENT_INIT_ERROR',
      error
    )
  }
}

/**
 * Verifies that a user is authenticated
 * @throws SupabaseError if not authenticated
 */
export async function verifyAuth(client: SupabaseClient<Database>) {
  const { data: { session }, error } = await client.auth.getSession()

  if (error) {
    throw new SupabaseError('Authentication failed', 'AUTH_ERROR', error)
  }

  if (!session) {
    throw new SupabaseError('No active session', 'AUTH_ERROR')
  }

  return session
}

/**
 * Checks if a user has admin privileges
 * @throws SupabaseError if check fails
 */
export async function verifyAdmin(client: SupabaseClient<Database>) {
  const session = await verifyAuth(client)
  const { data: profile, error } = await client
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (error) {
    throw new SupabaseError('Failed to fetch user role', 'DB_ERROR', error)
  }

  if (!profile || profile.role !== 'admin') {
    throw new SupabaseError('Insufficient privileges', 'AUTH_ERROR')
  }

  return profile
}

/**
 * Safely executes a database query with error handling
 */
export async function executeQuery<T>(
  operation: () => Promise<{ data: T | null; error: any }>
) {
  try {
    const { data, error } = await operation()

    if (error) {
      throw new SupabaseError('Database operation failed', 'DB_ERROR', error)
    }

    return data
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error
    }
    throw new SupabaseError('Unexpected error', 'UNKNOWN_ERROR', error)
  }
}

/**
 * Transforms a Supabase timestamp to a Date object
 */
export function parseSupabaseTimestamp(timestamp: string | null): Date | null {
  if (!timestamp) return null
  return new Date(timestamp)
}

/**
 * Formats a date for Supabase timestamp fields
 */
export function formatSupabaseTimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * Safely handles JSON metadata fields
 */
export function parseMetadata<T>(metadata: unknown): T | null {
  if (!metadata) return null
  try {
    return typeof metadata === 'string' ? JSON.parse(metadata) : metadata as T
  } catch {
    return null
  }
} 
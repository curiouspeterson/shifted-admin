/**
 * Supabase Client Configuration and Utilities
 * Last Updated: 2024
 * 
 * This file provides centralized Supabase client initialization and helper functions.
 * It includes:
 * - Different client configurations for various contexts (server, browser, admin)
 * - Authentication utilities
 * - Employee-related helper functions
 * 
 * The clients are configured with appropriate settings for their specific use cases,
 * ensuring proper authentication and cookie handling in different contexts.
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { createServerCookieHandler } from './cookies'
import { AppError } from '../errors'

/**
 * Server-Side Supabase Client
 * Used in API routes and server-side operations
 * Includes cookie handling for maintaining session state
 */
export function createServer() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createServerCookieHandler()
    }
  )
}

/**
 * Browser-Side Supabase Client
 * Singleton instance for client-side operations
 * Uses anon key for public access
 */
export const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

/**
 * Server Component Supabase Client
 * Specifically for use in React Server Components
 * Includes cookie handling for session management
 */
export function createServerComponent() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createServerCookieHandler()
    }
  )
}

/**
 * Admin Supabase Client
 * Uses service role key for elevated privileges
 * No cookie handling or session persistence
 * CAUTION: Only use for admin-level operations
 */
export const adminClient = createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    cookies: {
      get: () => undefined,
      set: () => {},
      remove: () => {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Authentication Verification
 * Checks if there is a valid session
 * Throws appropriate errors for authentication failures
 * @param client - Supabase client instance
 * @returns The current session if valid
 * @throws AppError if authentication fails or no session exists
 */
export async function verifyAuth(client: ReturnType<typeof createServer>) {
  const { data: { session }, error } = await client.auth.getSession()
  
  if (error) {
    throw new AppError('Authentication failed', 401)
  }
  
  if (!session) {
    throw new AppError('Unauthorized', 401)
  }
  
  return session
}

/**
 * Employee Details Retrieval
 * Fetches employee information by user ID
 * @param client - Supabase client instance
 * @param userId - The user's ID to look up
 * @returns Employee details if found
 * @throws AppError if employee not found or database error occurs
 */
export async function getEmployeeDetails(client: ReturnType<typeof createServer>, userId: string) {
  const { data: employee, error } = await client
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    throw new AppError('Failed to fetch employee details', 500)
  }
  
  if (!employee) {
    throw new AppError('Employee not found', 404)
  }
  
  return employee
}

/**
 * Supervisor Check
 * Determines if a user has supervisor privileges
 * @param client - Supabase client instance
 * @param userId - The user's ID to check
 * @returns boolean indicating if user is a supervisor
 * @throws AppError if check fails or employee not found
 */
export async function isSupervisor(client: ReturnType<typeof createServer>, userId: string) {
  const { data: employee, error } = await client
    .from('employees')
    .select('position')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    throw new AppError('Failed to check permissions', 500)
  }
  
  if (!employee) {
    throw new AppError('Employee not found', 404)
  }
  
  return ['shift_supervisor', 'management'].includes(employee.position)
} 
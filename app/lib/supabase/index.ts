/**
 * Supabase Client Configuration and Utilities
 * Last Updated: 2024-03
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

import { createServerClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { createServerCookieHandler } from './cookies'
import { AuthError, NotFoundError, DatabaseError } from '../errors'
import { supabase } from './supabaseClient'
import { supabaseAdmin } from './admin'

type SupabaseClientType = ReturnType<typeof createServer>

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
export { supabase as browserSupabase }

/**
 * Admin Supabase Client
 * Uses service role key for elevated privileges
 * No cookie handling or session persistence
 * CAUTION: Only use for admin-level operations
 */
export { supabaseAdmin }

/**
 * Authentication Verification
 * Checks if there is a valid session
 * Throws appropriate errors for authentication failures
 * @param client - Supabase client instance
 * @returns The current session if valid
 * @throws AuthError if authentication fails or no session exists
 */
export async function verifyAuth(client: SupabaseClientType) {
  const { data: { session }, error } = await client.auth.getSession()
  
  if (error) {
    throw new AuthError('UNAUTHORIZED', 'Authentication failed', error)
  }
  
  if (!session) {
    throw new AuthError('UNAUTHORIZED', 'No active session')
  }
  
  return session
}

/**
 * Employee Details Retrieval
 * Fetches employee information by user ID
 * @param client - Supabase client instance
 * @param userId - The user's ID to look up
 * @returns Employee details if found
 * @throws DatabaseError if database operation fails
 * @throws NotFoundError if employee not found
 */
export async function getEmployeeDetails(client: SupabaseClientType, userId: string) {
  const { data: employee, error } = await client
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    throw new DatabaseError('Failed to fetch employee details', error)
  }
  
  if (!employee) {
    throw new NotFoundError('Employee not found')
  }
  
  return employee
}

/**
 * Supervisor Check
 * Determines if a user has supervisor privileges
 * @param client - Supabase client instance
 * @param userId - The user's ID to check
 * @returns boolean indicating if user is a supervisor
 * @throws DatabaseError if database operation fails
 * @throws NotFoundError if employee not found
 */
export async function isSupervisor(client: SupabaseClientType, userId: string) {
  const { data: employee, error } = await client
    .from('employees')
    .select('position')
    .eq('user_id', userId)
    .single()
    
  if (error) {
    throw new DatabaseError('Failed to check permissions', error)
  }
  
  if (!employee) {
    throw new NotFoundError('Employee not found')
  }
  
  return ['shift_supervisor', 'management'].includes(employee.position)
} 
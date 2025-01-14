import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { createServerCookieHandler } from './cookies'
import { AppError } from '../errors'

// Server-side client (for API routes and Server Components)
export function createServer() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createServerCookieHandler()
    }
  )
}

// Client-side singleton
export const browserClient = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Server Component client
export function createServerComponent() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: createServerCookieHandler()
    }
  )
}

// Admin client with service role
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

// Helper to verify authentication
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

// Helper to get employee details
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

// Helper to check if user is supervisor
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
/**
 * Supabase Module Exports
 * Last Updated: 2024-03
 * 
 * This file serves as the main entry point for all Supabase-related functionality.
 * It re-exports types, clients, hooks, and utilities for easy access.
 */

// Type exports
export type * from './database.types'

// Client exports
export { createClient as createBrowserClient } from './client'
export { createClient as createServerClient } from './server'
export { createClient as createMiddlewareClient } from './middleware'

// Hook exports
export { useSession, useRealtimeSubscription, useQuery } from './hooks' 
/**
 * Supabase Browser Client Module
 * Last Updated: 2024
 * 
 * Provides browser-side Supabase client initialization and configuration.
 * This module creates and exports a singleton client instance for use
 * in client-side components and operations.
 * 
 * Features:
 * - Type-safe database operations
 * - Browser-specific client configuration
 * - Singleton pattern for consistent client access
 */

'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from './database.types'

/**
 * Create Browser Client
 * Creates a new Supabase client configured for browser usage
 * Uses environment variables for URL and anon key
 * 
 * @returns Typed Supabase client instance
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Singleton Client Instance
 * Pre-configured Supabase client for browser-side usage
 * Ensures consistent client usage across the application
 */
export const supabase = createClient() 
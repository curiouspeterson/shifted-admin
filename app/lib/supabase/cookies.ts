/**
 * Cookie Handling Utilities
 * Last Updated: 2024
 * 
 * This file provides cookie management utilities for both server-side
 * and middleware contexts. It implements consistent cookie handling
 * interfaces for Supabase authentication across different contexts.
 * 
 * The utilities handle:
 * - Cookie reading, writing, and deletion
 * - Error handling for cookie operations
 * - Type-safe cookie management
 */

import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

/**
 * Cookie Handler Interface
 * Defines the standard interface for cookie operations
 * Used by both server-side and middleware handlers
 */
export type CookieHandler = {
  /** Retrieves a cookie value by name */
  get(name: string): string | undefined

  /** Sets a cookie with the given name, value, and options */
  set(name: string, value: string, options: CookieOptions): void

  /** Removes a cookie with the given name and options */
  remove(name: string, options: CookieOptions): void
}

/**
 * Server-Side Cookie Handler
 * Creates a cookie handler for use in server-side contexts (API routes, Server Components)
 * Uses Next.js cookies() API for server-side cookie management
 * Includes error handling for cookie operations
 * 
 * @returns CookieHandler implementation for server-side use
 */
export function createServerCookieHandler(): CookieHandler {
  const cookieStore = cookies()
  
  return {
    /**
     * Get Cookie Value
     * Retrieves a cookie value from the server-side cookie store
     * @param name - Name of the cookie to retrieve
     * @returns The cookie value if found, undefined otherwise
     */
    get(name: string) {
      return cookieStore.get(name)?.value
    },

    /**
     * Set Cookie
     * Sets a cookie in the server-side cookie store
     * Includes error handling for cookie setting failures
     * 
     * @param name - Name of the cookie to set
     * @param value - Value to store in the cookie
     * @param options - Cookie options (e.g., path, expires, etc.)
     */
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        console.error(`Error setting cookie ${name}:`, error)
      }
    },

    /**
     * Remove Cookie
     * Deletes a cookie from the server-side cookie store
     * Includes error handling for cookie deletion failures
     * 
     * @param name - Name of the cookie to remove
     * @param options - Cookie options (e.g., path, domain, etc.)
     */
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.delete({ name, ...options })
      } catch (error) {
        console.error(`Error removing cookie ${name}:`, error)
      }
    }
  }
}

/**
 * Middleware Cookie Handler
 * Creates a cookie handler for use in middleware context
 * Uses Next.js Request/Response objects for cookie management
 * 
 * @param request - Next.js request object containing incoming cookies
 * @param response - Next.js response object for setting outgoing cookies
 * @returns CookieHandler implementation for middleware use
 */
export function createMiddlewareCookieHandler(
  request: NextRequest,
  response: NextResponse
): CookieHandler {
  return {
    /**
     * Get Cookie Value
     * Retrieves a cookie value from the request
     * @param name - Name of the cookie to retrieve
     * @returns The cookie value if found, undefined otherwise
     */
    get(name: string) {
      return request.cookies.get(name)?.value
    },

    /**
     * Set Cookie
     * Sets a cookie in the response
     * @param name - Name of the cookie to set
     * @param value - Value to store in the cookie
     * @param options - Cookie options (e.g., path, expires, etc.)
     */
    set(name: string, value: string, options: CookieOptions) {
      response.cookies.set({
        name,
        value,
        ...options
      })
    },

    /**
     * Remove Cookie
     * Deletes a cookie via the response
     * @param name - Name of the cookie to remove
     * @param options - Cookie options (e.g., path, domain, etc.)
     */
    remove(name: string, options: CookieOptions) {
      response.cookies.delete(name)
    }
  }
} 
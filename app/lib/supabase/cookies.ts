import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { CookieOptions } from '@supabase/ssr'

export type CookieHandler = {
  get(name: string): string | undefined
  set(name: string, value: string, options: CookieOptions): void
  remove(name: string, options: CookieOptions): void
}

export function createServerCookieHandler(): CookieHandler {
  const cookieStore = cookies()
  
  return {
    get(name: string) {
      return cookieStore.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      try {
        cookieStore.set({ name, value, ...options })
      } catch (error) {
        console.error(`Error setting cookie ${name}:`, error)
      }
    },
    remove(name: string, options: CookieOptions) {
      try {
        cookieStore.delete({ name, ...options })
      } catch (error) {
        console.error(`Error removing cookie ${name}:`, error)
      }
    }
  }
}

export function createMiddlewareCookieHandler(
  request: NextRequest,
  response: NextResponse
): CookieHandler {
  return {
    get(name: string) {
      return request.cookies.get(name)?.value
    },
    set(name: string, value: string, options: CookieOptions) {
      response.cookies.set({
        name,
        value,
        ...options
      })
    },
    remove(name: string, options: CookieOptions) {
      response.cookies.delete(name)
    }
  }
} 
/**
 * Authentication Actions
 * Last Updated: 2025-03-19
 * 
 * Server actions for handling authentication flows.
 */

'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AuthError } from '@/app/lib/errors/auth'
import { ValidationError } from '@/app/lib/errors/validation'
import { loginRequestSchema } from '@/app/lib/validations/auth'
import type { Database } from '@/types/supabase'

export type AuthResult = {
  success: boolean
  error?: string
  data?: {
    userId: string
    email: string
    firstName: string
    lastName: string
  }
}

export async function signIn(formData: FormData): Promise<AuthResult> {
  try {
    // Validate form data
    const emailValue = formData.get('email')?.toString()
    const passwordValue = formData.get('password')?.toString()

    if (typeof emailValue !== 'string' || emailValue.length === 0 || 
        typeof passwordValue !== 'string' || passwordValue.length === 0) {
      throw new ValidationError('Missing required fields', [{
        path: ['form'],
        message: 'Email and password are required',
        code: 'REQUIRED_FIELD'
      }])
    }

    const validatedData = loginRequestSchema.parse({
      email: emailValue,
      password: passwordValue
    })

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient<Database>(
      process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '',
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? '',
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Attempt authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password
    })

    // Handle authentication errors
    if (error !== null) {
      throw new AuthError('Authentication failed', {
        cause: error,
        details: {
          message: error.message,
          status: 401
        }
      })
    }

    // Validate response data
    if (data === null || data.user === null || data.session === null) {
      throw new AuthError('Invalid authentication response')
    }

    // Return success result
    return {
      success: true,
      data: {
        userId: data.user.id,
        email: data.user.email ?? '',
        firstName: data.user.user_metadata['firstName'] ?? '',
        lastName: data.user.user_metadata['lastName'] ?? ''
      }
    }
  } catch (error: unknown) {
    // Log error
    console.error('Sign in error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })

    // Return error result
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
} 
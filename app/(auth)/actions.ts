/**
 * Authentication Actions
 * Last Updated: 2025-03-19
 * 
 * Server actions for handling authentication operations.
 */

'use server'

import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import { redirect } from 'next/navigation'
import { z } from 'zod'

// Validation schema for sign in data
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

export async function signIn(formData: FormData) {
  try {
    const emailValue = formData.get('email')
    const passwordValue = formData.get('password')

    if (emailValue === null || passwordValue === null) {
      throw new Error('Email and password are required')
    }

    const validationResult = signInSchema.safeParse({
      email: String(emailValue),
      password: String(passwordValue)
    })

    if (!validationResult.success) {
      const [firstError] = validationResult.error.errors
      throw new Error(firstError?.message ?? 'Invalid input')
    }

    const { email, password } = validationResult.data
    const supabase = createClient()
    const result = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (result.error) {
      errorLogger.error('Sign in error:', {
        error: result.error.message,
        code: result.error.status,
        context: 'signIn'
      })
      throw result.error
    }

    const { data } = result
    const user = data?.user
    const session = data?.session

    if (!user?.id || !user?.email || !session?.access_token) {
      throw new Error('Authentication failed: Missing user or session data')
    }

    // Log successful sign in
    errorLogger.error('Sign in successful:', {
      userId: user.id,
      email: user.email,
      severity: 'info',
      context: 'signIn'
    })

    redirect('/dashboard')
  } catch (error) {
    errorLogger.error('Sign in error:', {
      error,
      context: 'signIn',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function signInWithGoogle() {
  try {
    const supabase = createClient()
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    })

    if (result.error) {
      errorLogger.error('Google sign in error:', {
        error: result.error.message,
        code: result.error.status,
        context: 'signInWithGoogle'
      })
      throw result.error
    }

    const { data } = result
    const rawUrl = data?.url
    
    if (typeof rawUrl !== 'string') {
      throw new Error('Failed to get OAuth URL: Invalid URL type')
    }

    const url = rawUrl.trim()
    if (url === '') {
      throw new Error('Failed to get OAuth URL: Empty URL')
    }

    return redirect(url)
  } catch (error) {
    errorLogger.error('Google sign in error:', {
      error,
      context: 'signInWithGoogle',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
}

export async function signOut() {
  try {
    const supabase = createClient()
    const result = await supabase.auth.signOut()

    if (result.error) {
      errorLogger.error('Sign out error:', {
        error: result.error.message,
        code: result.error.status,
        context: 'signOut'
      })
      throw result.error
    }

    // Log successful sign out
    errorLogger.error('Sign out successful:', {
      severity: 'info',
      context: 'signOut'
    })

    return redirect('/')
  } catch (error) {
    errorLogger.error('Sign out error:', {
      error,
      context: 'signOut',
      stack: error instanceof Error ? error.stack : undefined
    })
    throw error
  }
} 
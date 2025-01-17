/**
 * Authentication Actions
 * Last Updated: 2025-01-16
 * 
 * Server actions for authentication operations.
 */

'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { errorLogger } from '@/lib/logging/error-logger'

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  try {
    errorLogger.info('Sign in attempt', {
      context: {
        email,
        timestamp: new Date().toISOString()
      }
    })

    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (signInError) {
      errorLogger.error('Sign in failed', {
        error: signInError,
        context: {
          email,
          timestamp: new Date().toISOString()
        }
      })
      return { error: signInError.message }
    }

    if (!session) {
      errorLogger.error('No session after sign in', {
        context: {
          email,
          timestamp: new Date().toISOString()
        }
      })
      return { error: 'Authentication failed' }
    }

    // Verify session is valid
    const { error: sessionError } = await supabase.auth.getSession()
    if (sessionError) {
      errorLogger.error('Session verification failed', {
        error: sessionError,
        context: {
          email,
          timestamp: new Date().toISOString()
        }
      })
      return { error: 'Session verification failed' }
    }

    errorLogger.info('Sign in successful', {
      context: {
        email,
        userId: session.user.id,
        timestamp: new Date().toISOString()
      }
    })

    redirect('/dashboard')
  } catch (error) {
    errorLogger.error('Unexpected error during sign in', {
      error,
      context: {
        email,
        timestamp: new Date().toISOString()
      }
    })
    return { error: 'An unexpected error occurred' }
  }
} 
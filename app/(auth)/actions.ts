/**
 * Authentication Actions Module
 * Last Updated: 2024
 * 
 * Provides server-side authentication actions for user sign-in.
 * This module handles form submission, authentication with Supabase,
 * session management, and redirection after successful authentication.
 * 
 * Features:
 * - Server-side form handling
 * - Secure password authentication
 * - Cookie-based session management
 * - Error handling and validation
 * - Automatic redirection
 * - Cache revalidation
 */

'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Sign In Action
 * Handles user authentication through form submission
 * 
 * Flow:
 * 1. Validates required form fields
 * 2. Creates Supabase client with cookie handling
 * 3. Attempts password-based authentication
 * 4. Verifies session creation
 * 5. Revalidates cache and redirects on success
 * 
 * @param formData - Form data containing email, password, and redirect path
 * @returns Redirects to dashboard on success or sign-in page with error on failure
 */
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectedFrom = formData.get('redirectedFrom') as string
  
  // Validate required fields
  if (!email || !password) {
    redirect('/sign-in?error=' + encodeURIComponent('Email and password are required'))
  }

  const cookieStore = await cookies()
  console.log('🔐 Attempting sign in for:', email)

  // Initialize Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.error('Error setting cookie:', error)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete(name)
          } catch (error) {
            console.error('Error removing cookie:', error)
          }
        },
      },
    }
  )

  try {
    // Attempt password-based authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign in error:', error)
      return redirect('/sign-in?error=' + encodeURIComponent(error.message))
    }

    if (!data?.session) {
      console.error('❌ No session after sign in')
      return redirect('/sign-in?error=' + encodeURIComponent('Failed to create session'))
    }

    // Verify session was properly created
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      console.error('❌ Session verification failed:', sessionError)
      return redirect('/sign-in?error=' + encodeURIComponent('Session verification failed'))
    }

    console.log('✅ Sign in successful')
    revalidatePath('/', 'layout')
    
    // Use a short delay to ensure cookies are set
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return redirect(redirectedFrom || '/dashboard')
  } catch (error) {
    console.error('❌ Unexpected error during sign in:', error)
    return redirect('/sign-in?error=' + encodeURIComponent('An unexpected error occurred'))
  }
} 
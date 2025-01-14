'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const redirectedFrom = formData.get('redirectedFrom') as string
  
  if (!email || !password) {
    redirect('/sign-in?error=' + encodeURIComponent('Email and password are required'))
  }

  const cookieStore = await cookies()
  console.log('🔐 Attempting sign in for:', email)

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

    // Ensure the session is set in cookies
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
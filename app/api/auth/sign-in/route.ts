import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { email, password } = await req.json()

    // Sign in user
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      console.error('Sign in error:', signInError)
      return NextResponse.json(
        { error: signInError.message },
        { status: 400 }
      )
    }

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to sign in' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error in POST /api/auth/sign-in:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign in' },
      { status: 500 }
    )
  }
} 
import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { email, password } = await req.json()

    // Create user
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      console.error('Sign up error:', signUpError)
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      )
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error in POST /api/auth/sign-up:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign up' },
      { status: 500 }
    )
  }
} 
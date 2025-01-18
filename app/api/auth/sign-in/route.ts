/**
 * Sign In API Route
 * Last Updated: 2025-03-19
 * 
 * Handles user sign in.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import { loginRequestSchema, type LoginResponse } from '@/app/lib/validations/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = loginRequestSchema.parse(body)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    })

    if (error) {
      errorLogger.error('Sign in error:', {
        error: error.message,
        name: error.name,
        stack: error.stack
      })
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    if (data === null) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    if (data.user === null) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (data.session === null) {
      return NextResponse.json(
        { error: 'Session creation failed' },
        { status: 401 }
      )
    }

    const response: LoginResponse = {
      user: {
        id: data.user.id,
        email: data.user.email!,
        firstName: data.user.user_metadata.first_name,
        lastName: data.user.user_metadata.last_name
      },
      token: data.session.access_token
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Sign in error:', error)
    errorLogger.error('Sign in error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { error: 'Failed to sign in' },
      { status: 500 }
    )
  }
} 
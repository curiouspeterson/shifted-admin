/**
 * Sign Up API Route
 * Last Updated: 2025-03-19
 * 
 * Handles user registration.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import * as z from 'zod'

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(2),
  last_name: z.string().min(2),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = signUpSchema.parse(body)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
        },
      },
    })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Sign up error:', error)
    return NextResponse.json(
      { error: 'Failed to sign up' },
      { status: 500 }
    )
  }
}
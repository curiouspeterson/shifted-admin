import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'

export const POST = createRouteHandler(
  async (req, { supabase }) => {
    const { email, password } = await req.json()

    // Validate input
    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    // Sign in user
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      throw new AppError(signInError.message, 400)
    }

    if (!session) {
      throw new AppError('Failed to sign in', 500)
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, position')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError) {
      throw new AppError('Failed to fetch employee details', 500)
    }

    return NextResponse.json({ 
      session,
      employee
    })
  },
  { requireAuth: false }
) 
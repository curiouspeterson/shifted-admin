/**
 * Sign In API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the authentication endpoint for user sign-in.
 * Handles email/password authentication using Supabase Auth and
 * retrieves associated employee details upon successful authentication.
 * 
 * Features:
 * - Email/password authentication
 * - Input validation
 * - Employee details retrieval
 * - Error handling with specific error messages
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/sign-in
 * Authenticates a user and returns their session and employee details
 * 
 * Request Body:
 * - email: User's email address
 * - password: User's password
 * 
 * Returns:
 * - session: Supabase session object
 * - employee: Associated employee details
 * 
 * Errors:
 * - 400: Missing credentials or invalid credentials
 * - 500: Server error or failed to fetch employee details
 */
export const POST = createRouteHandler(
  async (req, { supabase }) => {
    // Extract credentials from request body
    const { email, password } = await req.json()

    // Validate required fields
    if (!email || !password) {
      throw new AppError('Email and password are required', 400)
    }

    // Attempt authentication with Supabase
    const { data: { session }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    // Handle authentication errors
    if (signInError) {
      throw new AppError(signInError.message, 400)
    }

    if (!session) {
      throw new AppError('Failed to sign in', 500)
    }

    // Fetch associated employee details
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, first_name, last_name, position')
      .eq('user_id', session.user.id)
      .single()

    // Handle employee lookup errors
    if (employeeError) {
      throw new AppError('Failed to fetch employee details', 500)
    }

    // Return session and employee details
    return NextResponse.json({ 
      session,
      employee
    })
  },
  { requireAuth: false } // No auth required for sign-in endpoint
) 
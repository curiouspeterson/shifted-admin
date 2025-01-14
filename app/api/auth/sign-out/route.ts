/**
 * Sign-Out API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the user sign-out endpoint.
 * It handles:
 * - Session termination
 * - Cookie cleanup
 * - Auth state reset
 * 
 * The route requires authentication (default behavior) and
 * properly cleans up the user's session on successful sign-out.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'

/**
 * POST /api/auth/sign-out
 * Terminates the current user session
 * 
 * Requires authentication (handled by route handler)
 * No request body needed
 * Returns: Success confirmation
 */
export const POST = createRouteHandler(
  async (req, { supabase }) => {
    // Attempt to sign out user and cleanup session
    const { error } = await supabase.auth.signOut()

    // Handle any sign-out errors
    if (error) {
      throw new AppError(error.message, 500)
    }

    // Confirm successful sign-out
    return NextResponse.json({ success: true })
  }
) 
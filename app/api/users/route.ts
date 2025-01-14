/**
 * Users API Route Handler
 * Last Updated: 2024
 * 
 * This file implements the API endpoints for managing Supabase Auth users.
 * Currently supports:
 * - GET: Retrieve all users (supervisor access only)
 * 
 * This route provides access to user account information, separate from
 * employee records. It's primarily used for administrative purposes and
 * user management.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Validation Schemas
 * Define the shape and constraints for user data
 */

/**
 * Complete User Schema
 * Used for validating Supabase Auth user records
 * Includes core user data and metadata fields
 */
const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  created_at: z.string(),
  updated_at: z.string().nullable(),
  last_sign_in_at: z.string().nullable(),
  user_metadata: z.object({
    first_name: z.string(),
    last_name: z.string(),
    full_name: z.string()
  }).nullable()
})

/**
 * API Response Schema
 * Wraps user data in a response object
 */
const usersResponseSchema = z.object({
  users: z.array(userSchema)
})

/**
 * GET /api/users
 * Retrieves all user accounts from Supabase Auth
 * Requires supervisor access
 * 
 * Returns: Array of user objects containing:
 * - Basic user information (id, email)
 * - Timestamps (created, updated, last sign in)
 * - User metadata (name information)
 */
export const GET = createRouteHandler(
  async (req, { supabase }) => {
    // Fetch all users using admin API
    const { data: { users }, error } = await supabase.auth.admin.listUsers()

    if (error) {
      throw new AppError('Failed to fetch users', 500)
    }

    // Validate and return response data
    const validatedResponse = usersResponseSchema.parse({ users: users || [] })

    return NextResponse.json(validatedResponse)
  },
  { requireSupervisor: true } // Access control: only supervisors can list users
) 
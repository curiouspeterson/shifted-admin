/**
 * Sign-Up API Route Handler
 * Last Updated: 2024-03
 * 
 * This file implements the user registration endpoint.
 * It handles:
 * - User account creation in Supabase Auth
 * - Employee record creation in the database
 * - Automatic email confirmation
 * - Rollback on partial failures
 * 
 * The route is public (no authentication required) and creates
 * both the auth user and corresponding employee record atomically.
 */

import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { adminClient } from '@/app/lib/supabase'
import type { ApiResponse } from '@/app/lib/api/types'
import { z } from 'zod'

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  position: z.string().default('dispatcher')
})

type SignUpBody = z.infer<typeof signUpSchema>

/**
 * POST /api/auth/sign-up
 * Creates a new user account and employee record
 * 
 * Request body must contain:
 * - email: User's email address
 * - password: User's password
 * - firstName: User's first name
 * - lastName: User's last name
 * - position: User's position (defaults to 'dispatcher')
 * 
 * Returns: Created user and employee records
 */
export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: false,
  bodySchema: signUpSchema,
  handler: async ({ body, supabase }) => {
    const { email, password, firstName, lastName, position } = body as SignUpBody

    /**
     * Create User Account
     * Uses admin client to create user with immediate email confirmation
     * Sets user metadata with name information
     */
    const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      },
    })

    if (createError) {
      throw new AppError(createError.message, 400)
    }

    if (!user) {
      throw new AppError('Failed to create user', 500)
    }

    /**
     * Create Employee Record
     * Links to created user account via user_id
     * Sets default values for required fields
     * Includes automatic timestamps
     */
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert([{
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        position: position,
        hourly_rate: 0, // This should be set by admin later
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (employeeError) {
      /**
       * Rollback on Failure
       * If employee creation fails, delete the auth user
       * to maintain data consistency
       */
      await adminClient.auth.admin.deleteUser(user.id)
      throw new AppError('Failed to create employee record', 500)
    }

    // Return created records with 201 Created status
    return {
      data: { user, employee },
      error: null,
      status: 201,
      metadata: {
        timestamp: new Date().toISOString()
      }
    } as ApiResponse
  }
}) 
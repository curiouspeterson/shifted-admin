/**
 * Sign-Up API Route Handler
 * Last Updated: 2024-01-17
 * 
 * This file implements the user registration endpoint.
 * It handles:
 * - User account creation in Supabase Auth
 * - Employee record creation in the database
 * - Automatic email confirmation
 * - Rollback on partial failures
 */

import { createRouteHandler } from '@/lib/api/handler';
import { AppError } from '@/lib/errors/base';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/api/handler';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  position: z.string().default('dispatcher')
});

type SignUpBody = z.infer<typeof signUpSchema>;

export const POST = createRouteHandler({
  methods: ['POST'],
  requireAuth: false,
  bodySchema: signUpSchema,
  handler: async ({ body }) => {
    const { email, password, firstName, lastName, position } = body as SignUpBody;

    const supabase = createServerClient();

    // Create user account
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      },
    });

    if (createError) {
      throw new AppError(createError.message, 'AUTH_ERROR', 400);
    }

    if (!user) {
      throw new AppError('Failed to create user', 'AUTH_ERROR', 500);
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert([{
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        position: position,
        department: 'operations',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: 1
      }])
      .select()
      .single();

    if (employeeError) {
      // Rollback user creation
      await supabase.auth.admin.deleteUser(user.id);
      throw new AppError('Failed to create employee record', 'DATABASE_ERROR', 500);
    }

    return {
      data: { user, employee },
      error: null
    } as ApiResponse;
  }
});
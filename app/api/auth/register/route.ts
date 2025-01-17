/**
 * User Registration Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles new user registration requests.
 */

import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ExtendedNextRequest } from '@/lib/api/types';
import { z } from 'zod';
import { AuthenticationError } from '@/lib/errors';

// Rate limiter for registration attempts
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per window
  identifier: 'auth:register'
};

// Validation schema for registration
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters')
});

export const POST = createRouteHandler(async (req: ExtendedNextRequest) => {
  const data = await req.json();
  
  // Validate request body
  const result = await registerSchema.safeParseAsync(data);
  if (!result.success) {
    throw new AuthenticationError('Invalid registration data');
  }

  // Create user
  const { email, password, firstName, lastName } = result.data;
  const { data: authData, error } = await req.supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName
      }
    }
  });

  if (error) {
    throw new AuthenticationError(error.message);
  }

  return NextResponse.json({ 
    data: {
      user: authData.user,
      session: authData.session
    }
  });
}, {
  rateLimit: rateLimiter,
  validate: {
    body: registerSchema
  }
}); 
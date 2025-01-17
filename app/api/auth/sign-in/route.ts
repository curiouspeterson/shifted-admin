/**
 * Sign In Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user sign in requests.
 */

import { NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import type { ExtendedNextRequest } from '@/lib/api/types';
import { z } from 'zod';
import { AuthenticationError } from '@/lib/errors';

// Validation schema for sign-in credentials
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const POST = createRouteHandler(async (req: ExtendedNextRequest) => {
  const data = await req.json();
  
  // Validate request body
  const result = await signInSchema.safeParseAsync(data);
  if (!result.success) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Attempt sign in
  const { email, password } = result.data;
  const { data: authData, error } = await req.supabase.auth.signInWithPassword({
    email,
    password
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
}); 
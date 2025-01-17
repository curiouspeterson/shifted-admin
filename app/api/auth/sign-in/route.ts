/**
 * Sign In Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles user sign in requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import { z } from 'zod';
import { AuthenticationError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

// Validation schema for sign-in credentials
const signInSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
});

export const POST = createRouteHandler(async (req: NextRequest) => {
  const data = await req.json();
  
  // Validate request body
  const result = await signInSchema.safeParseAsync(data);
  if (!result.success) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Attempt sign in
  const { email, password } = result.data;
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: authData, error } = await supabase.auth.signInWithPassword({
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
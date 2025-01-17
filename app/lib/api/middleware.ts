/**
 * API Middleware
 * Last Updated: 2025-01-17
 * 
 * Middleware for API request handling, including Supabase client initialization
 * and request validation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import type { ExtendedNextRequest } from './types';

/**
 * Attaches Supabase client and session to the request
 */
export async function withSupabase(req: NextRequest): Promise<ExtendedNextRequest> {
  const res = new NextResponse();
  const supabase = createClient(req, res);
  
  // Get session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Get user if session exists
  const user = session?.user ?? undefined;

  // Extend request with Supabase client and auth data
  return Object.assign(req, {
    supabase,
    session,
    user,
  }) as ExtendedNextRequest;
} 
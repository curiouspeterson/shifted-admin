/**
 * Supabase Cookies Utility
 * Last Updated: 2024-01-16
 * 
 * Utilities for handling Supabase authentication cookies
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../database/database.types';

export function getSupabaseCookies() {
  return cookies();
}

export function createSupabaseServerClient() {
  return createServerComponentClient<Database>({ cookies: getSupabaseCookies() });
}

export async function getSession() {
  const supabase = createSupabaseServerClient();
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}
/**
 * Supabase Module
 * Last Updated: 2024-01-16
 * 
 * Provides utilities for interacting with Supabase
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '../database/database.types';

export function createServerClient() {
  return createServerComponentClient<Database>({ cookies });
}

export function createBrowserClient() {
  return createClientComponentClient<Database>();
}

export type { Database };
export * from './cookies';
/**
 * Root Page Component
 * Last Updated: 2024
 * 
 * Serves as the application's entry point and handles initial routing
 * based on authentication status. This component performs authentication
 * checks and redirects users to the appropriate page.
 * 
 * Features:
 * - Server-side authentication check
 * - Automatic redirection
 * - Error handling for auth failures
 * - Integration with Supabase auth
 */

import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

/**
 * Home Component
 * Checks authentication status and redirects accordingly:
 * - Authenticated users -> dashboard
 * - Unauthenticated users -> sign-in
 * - Auth errors -> sign-in with error logging
 * 
 * @returns null (component always redirects)
 */
export default async function Home() {
  const supabase = createClient();
  
  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError) {
    console.error('Auth error:', authError);
    redirect('/sign-in');
  }
  
  // Redirect based on authentication status
  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/sign-in');
  }
  
  // This won't be reached, but is needed for TypeScript
  return null;
}

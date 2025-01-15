/**
 * Root Page Component
 * Last Updated: 2024-03-20
 * 
 * This is the main landing page of the application.
 * It handles authentication state and redirects accordingly.
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Root Page Component
 * Handles authentication and redirects
 */
export default async function Page() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/sign-in')
  }

  redirect('/dashboard')
}

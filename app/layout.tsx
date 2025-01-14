/**
 * Root Layout Component
 * Last Updated: 2024
 * 
 * Provides the application's root layout structure and handles
 * global authentication and employee data fetching. This component
 * wraps all pages and ensures proper context initialization.
 * 
 * Features:
 * - Global styles and fonts
 * - Authentication check
 * - Employee data fetching
 * - Context providers setup
 * - Hydration warnings suppression
 */

import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

// Initialize Inter font with Latin subset
const inter = Inter({ subsets: ['latin'] });

/**
 * Application Metadata
 * Defines global metadata for the application
 */
export const metadata: Metadata = {
  title: 'Shifted',
  description: 'Employee scheduling and management',
};

/**
 * Root Layout Component
 * Handles authentication, employee data fetching, and global layout
 * 
 * Flow:
 * 1. Checks authentication status
 * 2. Fetches employee details if authenticated
 * 3. Redirects to sign-in if any checks fail
 * 4. Renders layout with providers if all checks pass
 * 
 * @param props.children - Child components to render within layout
 * @returns Application root layout with providers and context
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Check if user is authenticated
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  if (authError || !session) {
    redirect('/sign-in');
  }

  // Get employee details
  const { data: employee, error: employeeError } = await supabase
    .from('employees')
    .select('id, first_name, last_name, position')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (employeeError) {
    console.error('Error fetching employee:', employeeError);
    redirect('/sign-in');
  }

  if (!employee) {
    console.error('No employee record found');
    redirect('/sign-in');
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers employee={employee}>
          {children}
        </Providers>
      </body>
    </html>
  );
}

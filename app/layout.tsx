import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shifted',
  description: 'Employee scheduling and management',
};

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

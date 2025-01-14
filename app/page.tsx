import { createClient } from '@/app/lib/supabase/server';
import { redirect } from 'next/navigation';

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

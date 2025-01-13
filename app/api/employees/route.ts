import { cookies } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('last_name', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({ data, error: null });
  } catch (error) {
    console.error('Failed to fetch employees:', error);
    return Response.json(
      { data: [], error: error instanceof Error ? error.message : 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
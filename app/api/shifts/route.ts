import { cookies } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';

export async function GET() {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  try {
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return Response.json({ shifts: data, error: null });
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    return Response.json(
      { shifts: [], error: error instanceof Error ? error.message : 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
} 
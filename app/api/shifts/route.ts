import { cookies } from 'next/headers';
import { createClient } from '@/app/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch shifts
    const { data, error } = await supabase
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ shifts: data });
  } catch (error) {
    console.error('Failed to fetch shifts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch shifts' },
      { status: 500 }
    );
  }
} 
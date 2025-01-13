import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/database.types';

export async function POST(request: Request) {
  try {
    console.log('Schedule creation started');
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient<Database>({ cookies });
    console.log('Supabase client created');

    // Use getUser() instead of getSession()
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, start_date, end_date } = body;
    console.log('Request body:', { name, start_date, end_date });

    if (!name || !start_date || !end_date) {
      console.log('Missing required fields:', { name, start_date, end_date });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Creating schedule...');
    const { data, error } = await supabase
      .from('schedules')
      .insert({
        name,
        start_date,
        end_date,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating schedule:', error);
      return NextResponse.json(
        { error: 'Failed to create schedule', details: error.message },
        { status: 500 }
      );
    }

    console.log('Schedule created successfully:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
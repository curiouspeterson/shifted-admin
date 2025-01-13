// app/api/requirements/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TimeBasedRequirement } from '@/app/lib/types/scheduling';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize Supabase client with cookie store
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookies()
    });
    
    // Check auth session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get schedule ID from params
    const scheduleId = params.id;

    // Fetch requirements
    const { data: requirements, error: requirementsError } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_of_week')
      .order('start_time');

    if (requirementsError) {
      console.error('Database error:', requirementsError);
      return NextResponse.json(
        { error: 'Failed to fetch requirements' },
        { status: 500 }
      );
    }

    return NextResponse.json(requirements || []);

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Initialize Supabase client with cookie store
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    
    // Check auth session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('Auth error:', sessionError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const scheduleId = params.id;
    const body = await request.json();
    const { min_employees, max_employees, min_supervisors, id } = body;

    const { data, error } = await supabase
      .from('time_based_requirements')
      .update({
        min_employees,
        max_employees,
        min_supervisors,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('schedule_id', scheduleId)
      .select()
      .single();

    if (error) {
      console.error('Error updating requirement:', error);
      return NextResponse.json(
        { error: 'Failed to update requirement', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error updating requirement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
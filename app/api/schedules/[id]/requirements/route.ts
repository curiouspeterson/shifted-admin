// app/api/requirements/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TimeBasedRequirement } from '@/app/lib/types/scheduling';
import { z } from 'zod';

const requirementSchema = z.object({
  id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  min_employees: z.number().min(1),
  max_employees: z.number().nullable(),
  min_supervisors: z.number().min(1)
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const scheduleId = params.id;
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single();

    if (scheduleError || !schedule) {
      return NextResponse.json(
        { error: 'Schedule not found' },
        { status: 404 }
      );
    }

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

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating requirement:', error);
    return NextResponse.json(
      { error: 'Failed to update requirement' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const scheduleId = params.id;
  
  // Debug logging
  console.log('[Requirements API] Init:', {
    scheduleId,
    url: request.url
  });

  try {
    // Initialize Supabase client with cookie store
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify auth session
    console.log('[Requirements API] Auth Check:', { checking: true });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('[Requirements API] Auth Error:', sessionError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!session) {
      console.log('[Requirements API] Auth Failed:', { reason: 'No user session found' });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Requirements API] Auth Result:', { hasSession: true });

    // Fetch requirements
    const { data: requirements, error: requirementsError } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_of_week')
      .order('start_time');

    if (requirementsError) {
      console.error('[Requirements API] Query Error:', requirementsError);
      return NextResponse.json({ error: 'Failed to fetch requirements' }, { status: 500 });
    }

    return NextResponse.json(requirements);
  } catch (error) {
    console.error('[Requirements API] Unexpected Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
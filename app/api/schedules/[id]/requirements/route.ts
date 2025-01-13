// app/api/requirements/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { TimeBasedRequirement } from '@/lib/types/scheduling';
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

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const requirement = requirementSchema.parse(body);

    const { data, error } = await supabase
      .from('time_based_requirements')
      .update({
        min_employees: requirement.min_employees,
        max_employees: requirement.max_employees,
        min_supervisors: requirement.min_supervisors,
        updated_at: new Date().toISOString()
      })
      .eq('id', requirement.id)
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
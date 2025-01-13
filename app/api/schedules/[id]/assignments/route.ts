import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { assignmentsResponseSchema } from '@/app/lib/schemas/schedule';
import { APIError, handleError } from '@/app/lib/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: assignments, error } = await supabaseAdmin
      .from('schedule_assignments')
      .select(`
        *,
        employee:employees(*),
        shift:shifts(*)
      `)
      .eq('schedule_id', params.id);

    if (error) {
      throw new APIError(error.message, error.code === 'PGRST116' ? 404 : 500);
    }

    // Validate response data
    const validatedResponse = assignmentsResponseSchema.parse({
      data: assignments ?? [],
      error: null,
    });

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    
    const { message, status } = handleError(error);
    
    // Validate error response
    const validatedResponse = assignmentsResponseSchema.parse({
      data: [],
      error: message,
    });

    return NextResponse.json(validatedResponse, { status });
  }
} 
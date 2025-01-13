import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { timeRequirementsResponseSchema } from '@/app/lib/schemas/schedule';
import { APIError, handleError } from '@/app/lib/utils/errors';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: requirements, error } = await supabaseAdmin
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', params.id);

    if (error) {
      throw new APIError(error.message, error.code === 'PGRST116' ? 404 : 500);
    }

    // Validate response data
    const validatedResponse = timeRequirementsResponseSchema.parse({
      data: requirements ?? [],
      error: null,
    });

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error fetching time requirements:', error);
    
    const { message, status } = handleError(error);
    
    // Validate error response
    const validatedResponse = timeRequirementsResponseSchema.parse({
      data: [],
      error: message,
    });

    return NextResponse.json(validatedResponse, { status });
  }
} 
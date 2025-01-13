import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { scheduleResponseSchema } from '@/app/lib/schemas/schedule'
import { APIError, handleError } from '@/app/lib/utils/errors'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get employee details to check permissions
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('position')
      .eq('user_id', session.user.id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return NextResponse.json(
        { error: 'Failed to verify permissions' },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Check if employee is a supervisor or manager
    if (!['supervisor', 'management'].includes(employee.position)) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { name, start_date, end_date } = body;

    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update schedule
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ 
        name,
        start_date,
        end_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PUT /api/schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get employee details to check permissions
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('position')
      .eq('user_id', session.user.id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return NextResponse.json(
        { error: 'Failed to verify permissions' },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Check if employee is a supervisor or manager
    if (!['supervisor', 'management'].includes(employee.position)) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { status } = body;

    if (!status || !['published', 'draft'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update schedule status
    const { error: updateError } = await supabase
      .from('schedules')
      .update({ 
        status,
        published_at: status === 'published' ? new Date().toISOString() : null,
        published_by: status === 'published' ? session.user.id : null
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating schedule:', updateError);
      return NextResponse.json(
        { error: 'Failed to update schedule status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Verify session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get employee details to check permissions
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('position')
      .eq('user_id', session.user.id)
      .single();

    if (employeeError) {
      console.error('Error fetching employee:', employeeError);
      return NextResponse.json(
        { error: 'Failed to verify permissions' },
        { status: 500 }
      );
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee record not found' },
        { status: 404 }
      );
    }

    // Check if employee is a supervisor or manager
    if (!['supervisor', 'management'].includes(employee.position)) {
      return NextResponse.json(
        { error: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Delete schedule
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      console.error('Error deleting schedule:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete schedule' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/schedules/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const { data: schedule, error } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (error) {
      throw new APIError(error.message, error.code === 'PGRST116' ? 404 : 500);
    }

    // Validate response data
    const validatedResponse = scheduleResponseSchema.parse({
      data: schedule,
      error: null,
    });

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    
    const { message, status } = handleError(error);
    
    // Validate error response
    const validatedResponse = scheduleResponseSchema.parse({
      data: null,
      error: message,
    });

    return NextResponse.json(validatedResponse, { status });
  }
} 
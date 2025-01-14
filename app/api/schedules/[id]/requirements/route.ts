// app/api/requirements/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { TimeBasedRequirement } from '@/app/lib/types/scheduling';
import type { Database } from '@/lib/database.types';

// Helper function to create Supabase client with minimal cookie handling
const createSupabaseClient = async () => {
  console.log('Creating Supabase client...');
  try {
    const cookieStore = await cookies();
    console.log('Cookie store initialized');
    
    // Log available cookies
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            try {
              const cookie = cookieStore.get(name);
              console.log(`Getting cookie ${name}:`, cookie?.value ? 'found' : 'not found');
              return cookie?.value;
            } catch (error) {
              console.error(`Error getting cookie ${name}:`, error);
              return undefined;
            }
          },
          set(name: string, value: string, options: { path?: string; domain?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean }) {
            try {
              cookieStore.set({ name, value, ...options });
              console.log(`Cookie ${name} set successfully`);
            } catch (error) {
              console.error(`Error setting cookie ${name}:`, error);
            }
          },
          remove(name: string, options: { path?: string; domain?: string }) {
            try {
              cookieStore.delete({ name, ...options });
              console.log(`Cookie ${name} removed successfully`);
            } catch (error) {
              console.error(`Error removing cookie ${name}:`, error);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('GET request received for schedule:', params.id);
  
  try {
    console.log('Initializing Supabase client...');
    const supabase = await createSupabaseClient();
    console.log('Supabase client initialized');

    console.log('Checking session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error', details: sessionError.message },
        { status: 401 }
      );
    }

    if (!session) {
      console.error('No session found');
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      );
    }

    console.log('Session found for user:', session.user.id);
    const scheduleId = params.id;
    console.log('Fetching requirements for schedule:', scheduleId);

    // Fetch requirements with pagination to handle large datasets
    const { data: requirements, error: requirementsError } = await supabase
      .from('time_based_requirements')
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('day_of_week')
      .order('start_time')
      .limit(100); // Add pagination

    if (requirementsError) {
      console.error('Database error:', requirementsError);
      return NextResponse.json(
        { error: 'Failed to fetch requirements', details: requirementsError.message },
        { status: 500 }
      );
    }

    console.log('Requirements fetched successfully:', requirements?.length || 0, 'items');
    
    // Return response with compression headers
    return new NextResponse(JSON.stringify(requirements || []), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, must-revalidate',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error('Error setting cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.delete(name);
            } catch (error) {
              console.error('Error removing cookie:', error);
            }
          },
        },
      }
    );
    
    // Check auth session
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return NextResponse.json(
        { error: 'Authentication failed', details: userError?.message },
        { status: 401 }
      );
    }

    const scheduleId = params.id;
    console.log('Updating requirements for schedule:', scheduleId);

    const body = await request.json();
    const { min_employees, max_employees, min_supervisors, id } = body;

    if (!id || typeof min_employees !== 'number' || typeof max_employees !== 'number' || typeof min_supervisors !== 'number') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
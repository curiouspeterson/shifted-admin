import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Helper function to verify session
async function verifySession(request: Request) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.split(' ')[1]
  const supabaseClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const { data: { user }, error } = await supabaseClient.auth.getUser(token)
  if (error || !user) {
    return null
  }

  return user
}

export async function GET(request: Request) {
  try {
    const user = await verifySession(request)
    if (!user) {
      console.log('No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch schedules data
    console.log('Fetching schedules data...')
    const { data: schedules, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .order('start_date', { ascending: false })

    if (fetchError) {
      console.error('Error fetching schedules:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch schedules' },
        { status: 500 }
      )
    }

    // Log the raw schedules data
    console.log('Successfully fetched schedules:', schedules)

    // Return the fetched schedules
    return NextResponse.json({ schedules })
  } catch (error: any) {
    console.error('Error in GET /api/schedules:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await verifySession(request)
    if (!user) {
      console.log('No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get employee record for current user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id, position')
      .eq('user_id', user.id)
      .single()

    if (employeeError || !employee) {
      console.error('Employee not found:', employeeError)
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Check if employee is a supervisor or manager
    if (!['supervisor', 'management', 'shift_supervisor'].includes(employee.position)) {
      console.error('Employee does not have permission to create schedules')
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get schedule data from request body
    const formData = await request.json()
    const { name, start_date, end_date } = formData

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create new schedule using user.id for created_by
    const { data: schedule, error: createError } = await supabaseAdmin
      .from('schedules')
      .insert([{
        name,
        start_date,
        end_date,
        status: 'draft',
        version: 1,
        is_active: true,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (createError) {
      console.error('Error creating schedule:', createError)
      return NextResponse.json(
        { error: 'Failed to create schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error: any) {
    console.error('Error in POST /api/schedules:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 
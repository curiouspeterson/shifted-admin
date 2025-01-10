import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

// Get current user's availability
export async function GET(request: Request) {
  try {
    // Get user session from cookie
    const cookieStore = cookies()
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

    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get employee record for current user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Get availability for employee
    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week')

    if (availabilityError) {
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ availability })
  } catch (error: any) {
    console.error('Error in GET /api/availability:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Set or update availability
export async function POST(request: Request) {
  try {
    // Get user session from cookie
    const cookieStore = cookies()
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

    const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession()
    
    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get employee record for current user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    const formData = await request.json()
    const { availability } = formData

    if (!Array.isArray(availability)) {
      return NextResponse.json(
        { error: 'Invalid availability data' },
        { status: 400 }
      )
    }

    // Validate availability data
    for (const slot of availability) {
      if (
        typeof slot.day_of_week !== 'number' ||
        slot.day_of_week < 0 ||
        slot.day_of_week > 6 ||
        typeof slot.start_time !== 'string' ||
        typeof slot.end_time !== 'string' ||
        typeof slot.is_available !== 'boolean'
      ) {
        return NextResponse.json(
          { error: 'Invalid availability data format' },
          { status: 400 }
        )
      }
    }

    // Delete existing availability
    const { error: deleteError } = await supabaseAdmin
      .from('employee_availability')
      .delete()
      .eq('employee_id', employee.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    // Insert new availability
    const availabilityData = availability.map(slot => ({
      employee_id: employee.id,
      day_of_week: slot.day_of_week,
      start_time: slot.start_time,
      end_time: slot.end_time,
      is_available: slot.is_available,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { error: insertError } = await supabaseAdmin
      .from('employee_availability')
      .insert(availabilityData)

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in POST /api/availability:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 
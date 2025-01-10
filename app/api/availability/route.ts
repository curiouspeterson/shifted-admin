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

// Get current user's availability
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

    console.log('Looking up employee for user:', user.id)
    
    // Get employee record for current user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (employeeError) {
      console.error('Error fetching employee:', employeeError)
      return NextResponse.json(
        { error: 'Error fetching employee record' },
        { status: 500 }
      )
    }

    if (!employee) {
      console.log('No employee found for user:', user.id)
      return NextResponse.json(
        { error: 'No employee record found for user' },
        { status: 404 }
      )
    }

    console.log('Found employee:', employee.id)

    // Get availability for employee
    const { data: availability, error: availabilityError } = await supabaseAdmin
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week')

    // If table doesn't exist or other error, return empty availability
    if (availabilityError?.code === '42P01') {
      console.log('Employee availability table does not exist yet - returning empty availability')
      return NextResponse.json({ availability: [] })
    }

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    // Return empty array if no availability found
    return NextResponse.json({ availability: availability || [] })
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
    const user = await verifySession(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get employee record for current user
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
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

    // Handle both "no rows deleted" and "table doesn't exist" as non-errors
    if (deleteError && deleteError.code !== 'PGRST116' && deleteError.code !== '42P01') {
      console.error('Error deleting existing availability:', deleteError)
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
      console.error('Error inserting availability:', insertError)
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
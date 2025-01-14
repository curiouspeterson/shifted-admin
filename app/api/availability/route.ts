import { createClient } from '@/app/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get employee ID for current user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('Employee fetch error:', employeeError)
      return NextResponse.json(
        { error: 'Failed to fetch employee details' },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'No employee record found' },
        { status: 404 }
      )
    }

    // Fetch availability for the employee
    const { data: availability, error: availabilityError } = await supabase
      .from('employee_availability')
      .select('*')
      .eq('employee_id', employee.id)
      .order('day_of_week', { ascending: true })

    if (availabilityError) {
      console.error('Availability fetch error:', availabilityError)
      return NextResponse.json(
        { error: 'Failed to fetch availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error in availability route:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createClient()

    // Verify authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get employee ID for current user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (employeeError) {
      console.error('Employee fetch error:', employeeError)
      return NextResponse.json(
        { error: 'Failed to fetch employee details' },
        { status: 500 }
      )
    }

    if (!employee) {
      return NextResponse.json(
        { error: 'No employee record found' },
        { status: 404 }
      )
    }

    // Get request data from body
    const formData = await req.json()

    // Upsert availability for the day
    const { data: availability, error: upsertError } = await supabase
      .from('employee_availability')
      .upsert({
        employee_id: employee.id,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
        is_available: formData.is_available
      })
      .select()
      .single()

    if (upsertError) {
      console.error('Availability upsert error:', upsertError)
      return NextResponse.json(
        { error: 'Failed to update availability' },
        { status: 500 }
      )
    }

    return NextResponse.json({ availability })
  } catch (error) {
    console.error('Error in POST /api/availability:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update availability' },
      { status: 500 }
    )
  }
} 
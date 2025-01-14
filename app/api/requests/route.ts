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

    // Get employee details to check if user is a supervisor/manager
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, position')
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

    // Determine if user is a manager
    const isManager = ['shift_supervisor', 'management'].includes(employee.position)

    // Fetch requests based on user role
    const requestsQuery = supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees!time_off_requests_employee_id_fkey (
          id,
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // If not a manager, only show their own requests
    if (!isManager) {
      requestsQuery.eq('employee_id', employee.id)
    }

    const { data: requests, error: requestsError } = await requestsQuery

    if (requestsError) {
      console.error('Requests fetch error:', requestsError)
      return NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Error in requests route:', error)
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

    // Create the request
    const { data: request, error: createError } = await supabase
      .from('time_off_requests')
      .insert([{
        employee_id: employee.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        request_type: formData.request_type,
        reason: formData.reason || null,
        status: 'pending'
      }])
      .select()
      .single()

    if (createError) {
      console.error('Create request error:', createError)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      )
    }

    return NextResponse.json({ request })
  } catch (error) {
    console.error('Error in POST /api/requests:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create request' },
      { status: 500 }
    )
  }
} 
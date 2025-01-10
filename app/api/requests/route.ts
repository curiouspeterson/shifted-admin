import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

interface TimeOffRequest {
  employee_id: string
  start_date: string
  end_date: string
  request_type: 'vacation' | 'sick' | 'personal' | 'other'
  reason: string | null
  status: 'pending' | 'approved' | 'denied'
  created_at: string
  updated_at: string
}

export async function GET(req: Request) {
  try {
    // Create a Supabase client with the service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the session from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Get employee details to check if user is a supervisor/manager
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id, position')
      .eq('user_id', user.id)
      .single()

    if (employeeError) throw employeeError
    if (!employee) throw new Error('Employee not found')

    // Build the query based on user's role
    let query = supabase
      .from('time_off_requests')
      .select(`
        *,
        employee:employees!time_off_requests_employee_id_fkey (
          first_name,
          last_name
        )
      `)
      .order('created_at', { ascending: false })

    // If not a supervisor/manager, only show their own requests
    if (!['shift_supervisor', 'management'].includes(employee.position)) {
      query = query.eq('employee_id', employee.id)
    }

    // Execute the query
    const { data: requests, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ requests })

  } catch (err) {
    console.error('Error in GET /api/requests:', err)
    return new NextResponse(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to fetch requests' }),
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    // Create a Supabase client with the service role key for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the session from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401 }
      )
    }

    // Get employee ID for current user
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (employeeError) throw employeeError
    if (!employee) throw new Error('Employee not found')

    // Get the request data from the body
    const formData = await req.json() as Partial<TimeOffRequest>

    // Create the request
    const { data: timeOffRequest, error } = await supabase
      .from('time_off_requests')
      .insert([{
        employee_id: employee.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        request_type: formData.request_type,
        reason: formData.reason || null,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ request: timeOffRequest })

  } catch (err) {
    console.error('Error in POST /api/requests:', err)
    return new NextResponse(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to create request' }),
      { status: 500 }
    )
  }
} 
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

interface TimeOffRequest {
  id: string
  employee_id: string
  start_date: string
  end_date: string
  request_type: 'vacation' | 'sick' | 'personal' | 'other'
  reason: string | null
  status: 'pending' | 'approved' | 'denied'
  approved_by: string | null
  created_at: string
  updated_at: string
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    // Only supervisors and managers can update request status
    if (!['shift_supervisor', 'management'].includes(employee.position)) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized - Only supervisors can update request status' }),
        { status: 403 }
      )
    }

    // Get the request ID from the URL
    const requestId = params.id

    // Get the update data from the body
    const updateData = await req.json() as Partial<TimeOffRequest>

    // Update the request
    const { data: timeOffRequest, error } = await supabase
      .from('time_off_requests')
      .update({
        status: updateData.status,
        approved_by: employee.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    return NextResponse.json({ request: timeOffRequest })

  } catch (err) {
    console.error('Error in PUT /api/requests/[id]:', err)
    return new NextResponse(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to update request' }),
      { status: 500 }
    )
  }
} 
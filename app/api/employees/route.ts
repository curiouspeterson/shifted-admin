import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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
    const authHeader = request.headers.get('Authorization')
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

    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url)
    const select = searchParams.get('select') || '*'
    const userId = searchParams.get('user_id')

    // Build the query
    let query = supabase.from('employees').select(select)
    if (userId) {
      query = query.eq('user_id', userId)
    }

    // Execute the query
    const { data: employees, error } = await query

    if (error) {
      console.error('Database error:', error)
      throw error
    }

    // Return single object if user_id is specified, otherwise return array
    return NextResponse.json({
      employees: userId ? employees[0] : employees
    })

  } catch (err) {
    console.error('Error in /api/employees:', err)
    return new NextResponse(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Failed to fetch employees' }),
      { status: 500 }
    )
  }
}
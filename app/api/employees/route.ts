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
    // Verify session first
    const user = await verifySession(request)
    if (!user) {
      console.log('No authenticated user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create admin client with service role key
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

    // Parse URL to get query parameters
    const { searchParams } = new URL(request.url)
    const select = searchParams.get('select') || '*'
    const userId = searchParams.get('user_id')

    // Build the query
    let query = supabaseAdmin.from('employees').select(select)
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
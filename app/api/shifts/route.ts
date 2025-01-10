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

    // Fetch shifts data
    console.log('Fetching shifts data...')
    const { data: shifts, error: fetchError } = await supabaseAdmin
      .from('shifts')
      .select('*')
      .order('start_time', { ascending: true })

    if (fetchError) {
      console.error('Error fetching shifts:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch shifts' },
        { status: 500 }
      )
    }

    // Log the raw shifts data
    console.log('Successfully fetched shifts:', shifts)

    // Return the fetched shifts
    return NextResponse.json({ shifts })
  } catch (error: any) {
    console.error('Error in GET /api/shifts:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
} 
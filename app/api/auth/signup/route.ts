import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName } = await request.json()

    // Create user with admin API to ensure it's created immediately
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`.trim(),
      },
    })

    if (createError) {
      console.error('Error creating user:', createError)
      return new NextResponse(createError.message, { status: 400 })
    }

    if (!user) {
      console.error('No user returned from createUser')
      return new NextResponse('Failed to create user', { status: 500 })
    }

    // The trigger will automatically create the employee record
    // No need to create it manually here

    return new NextResponse(JSON.stringify(user), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in signup route:', error)
    return new NextResponse(
      error instanceof Error ? error.message : 'An error occurred',
      { status: 500 }
    )
  }
} 
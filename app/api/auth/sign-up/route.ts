import { createRouteHandler } from '@/app/lib/api/handler'
import { AppError } from '@/app/lib/errors'
import { NextResponse } from 'next/server'
import { adminClient } from '@/app/lib/supabase'

export const POST = createRouteHandler(
  async (req, { supabase }) => {
    const { email, password, firstName, lastName, position = 'dispatcher' } = await req.json()

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      throw new AppError('All fields are required', 400)
    }

    // Create user with admin client to ensure immediate creation
    const { data: { user }, error: createError } = await adminClient.auth.admin.createUser({
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
      throw new AppError(createError.message, 400)
    }

    if (!user) {
      throw new AppError('Failed to create user', 500)
    }

    // Create employee record
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .insert([{
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: email,
        position: position,
        hourly_rate: 0, // This should be set by admin later
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (employeeError) {
      // Delete the user since employee creation failed
      await adminClient.auth.admin.deleteUser(user.id)
      throw new AppError('Failed to create employee record', 500)
    }

    return NextResponse.json({ 
      user,
      employee
    }, {
      status: 201
    })
  },
  { requireAuth: false }
) 
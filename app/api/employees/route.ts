import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
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
    
    const formData = await request.json()
    console.log('Received form data:', formData)

    try {
      // Check auth users first to see if email is taken
      const { data: existingUser, error: userError } = await supabaseAdmin.auth.admin.listUsers()
      const emailExists = existingUser?.users.some(user => user.email === formData.email)

      console.log('Auth user check:', {
        emailExists,
        error: userError
      })

      if (emailExists) {
        console.log('Found existing auth user with email:', formData.email)
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 400 }
        )
      }

      // Check if employee exists with detailed query
      const { data: existingEmployees, error: queryError, count } = await supabaseAdmin
        .from('employees')
        .select('id, email, user_id', { count: 'exact' })
        .eq('email', formData.email)

      console.log('Existing employee check:', { 
        count, 
        employees: existingEmployees,
        error: queryError
      })

      if (queryError) {
        console.error('Error checking for existing employee:', queryError)
        throw queryError
      }

      if (count && count > 0) {
        console.log('Found existing employee with email:', formData.email)
        return NextResponse.json(
          { error: 'An employee with this email already exists' },
          { status: 400 }
        )
      }

      // Create auth user
      console.log('Creating auth user for email:', formData.email)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: formData.email,
        password: Math.random().toString(36).slice(-24),
        email_confirm: true,
        user_metadata: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          full_name: `${formData.first_name} ${formData.last_name}`.trim()
        }
      })

      if (authError) {
        console.error('Error creating auth user:', authError)
        throw authError
      }

      console.log('Created auth user:', authData.user.id)

      // Wait a short time for the trigger to create the employee record
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Check if the trigger created the employee record
      const { data: createdEmployee, error: checkError } = await supabaseAdmin
        .from('employees')
        .select('*')
        .eq('user_id', authData.user.id)
        .single()

      if (checkError) {
        console.error('Error checking for created employee:', checkError)
        // Rollback: delete auth user if employee check fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        throw checkError
      }

      if (!createdEmployee) {
        // If the trigger didn't create the employee, create it manually
        const employeeData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          is_active: formData.is_active,
          user_id: authData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('Creating employee record manually:', employeeData)
        const { error: employeeError } = await supabaseAdmin
          .from('employees')
          .insert(employeeData)

        if (employeeError) {
          console.error('Error creating employee:', employeeError)
          // Rollback: delete auth user if employee creation fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          throw employeeError
        }
      } else {
        // Update the employee record with additional fields
        const { error: updateError } = await supabaseAdmin
          .from('employees')
          .update({
            phone: formData.phone,
            position: formData.position,
            is_active: formData.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', createdEmployee.id)

        if (updateError) {
          console.error('Error updating employee:', updateError)
          // Rollback: delete auth user and employee if update fails
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
          throw updateError
        }
      }

      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('Inner try-catch error:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'An employee with this email already exists' },
          { status: 400 }
        )
      }
      throw error
    }
  } catch (error: any) {
    console.error('Outer try-catch error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create employee' },
      { status: 400 }
    )
  }
}
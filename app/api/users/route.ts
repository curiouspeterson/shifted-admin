/**
 * Users API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for user management.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/supabase/database.types'

type User = Database['public']['Tables']['employees']['Row']
type UserInsert = Database['public']['Tables']['employees']['Insert']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    
    const supabase = createClient()
    let query = supabase
      .from('employees')
      .select<'employees', User>()
    
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true')
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    
    const user: UserInsert = {
      first_name: body.firstName,
      last_name: body.lastName,
      email: body.email,
      phone: body.phone,
      position: body.position,
      is_active: true
    }
    
    const { data, error } = await supabase
      .from('employees')
      .insert([user])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
} 
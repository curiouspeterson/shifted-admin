/**
 * Time Off API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for time-off requests.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

type TimeOffRequest = Database['public']['Tables']['time_off_requests']['Row']
type TimeOffRequestInsert = Database['public']['Tables']['time_off_requests']['Insert']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    
    const supabase = createClient()
    let query = supabase
      .from('time_off_requests')
      .select<'time_off_requests', TimeOffRequest>()
    
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }
    
    if (status) {
      query = query.eq('status', status as TimeOffRequest['status'])
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching time-off requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time-off requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    
    const timeOffRequest: TimeOffRequestInsert = {
      employee_id: body.employeeId,
      start_date: body.startDate,
      end_date: body.endDate,
      type: body.type,
      status: 'pending',
      reason: body.reason
    }
    
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert([timeOffRequest])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating time-off request:', error)
    return NextResponse.json(
      { error: 'Failed to create time-off request' },
      { status: 500 }
    )
  }
} 
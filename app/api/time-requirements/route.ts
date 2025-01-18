/**
 * Time Requirements API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for time requirements.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/supabase/database.types'

type TimeRequirement = Database['public']['Tables']['requirements']['Row']
type TimeRequirementInsert = Database['public']['Tables']['requirements']['Insert']

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const scheduleId = searchParams.get('scheduleId')
    
    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requirements')
      .select<'requirements', TimeRequirement>()
      .eq('schedule_id', scheduleId)
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching time requirements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time requirements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    
    const requirement: TimeRequirementInsert = {
      schedule_id: body.scheduleId,
      day_of_week: body.dayOfWeek,
      start_time: body.startTime,
      end_time: body.endTime,
      min_employees: body.minEmployees,
      max_employees: body.maxEmployees,
      notes: body.notes
    }
    
    const { data, error } = await supabase
      .from('requirements')
      .insert([requirement])
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating time requirement:', error)
    return NextResponse.json(
      { error: 'Failed to create time requirement' },
      { status: 500 }
    )
  }
}
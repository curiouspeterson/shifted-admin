/**
 * Availability API Route
 * Last Updated: 2025-03-19
 * 
 * Handles employee availability management.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!employeeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Availability error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const availabilityData: Database['public']['Tables']['availability']['Insert'] = {
      employee_id: body.employeeId,
      date: body.date,
      start_time: body.startTime,
      end_time: body.endTime,
      is_available: body.isAvailable,
    }

    const { error } = await supabase.from('availability').insert([availabilityData])

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Availability error:', error)
    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    )
  }
} 
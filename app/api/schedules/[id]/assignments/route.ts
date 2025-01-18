/**
 * Schedule Assignments API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for schedule assignments.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

type Params = {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*, schedules(*), employees(*)')
      .eq('schedule_id', params.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule assignments fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule assignments' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const assignmentData: Database['public']['Tables']['assignments']['Insert'] = {
      ...body,
      schedule_id: params.id
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert(assignmentData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Schedule assignments creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule assignments' },
      { status: 500 }
    )
  }
} 
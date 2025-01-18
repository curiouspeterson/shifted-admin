/**
 * Schedule Assignment API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for individual schedule assignments.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

type Params = {
  params: {
    id: string
    assignmentId: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('assignments')
      .select('*, schedules(*), employees(*)')
      .eq('schedule_id', params.id)
      .eq('id', params.assignmentId)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule assignment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule assignment' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const assignmentData: Database['public']['Tables']['assignments']['Update'] = {
      ...body,
      schedule_id: params.id
    }

    const { data, error } = await supabase
      .from('assignments')
      .update(assignmentData)
      .eq('id', params.assignmentId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule assignment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule assignment' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('assignments')
      .delete()
      .eq('id', params.assignmentId)
      .eq('schedule_id', params.id)

    if (error) {
      throw error
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Schedule assignment delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule assignment' },
      { status: 500 }
    )
  }
} 
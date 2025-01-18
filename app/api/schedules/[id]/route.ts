/**
 * Schedule API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for individual schedule records.
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
      .from('schedules')
      .select('*, assignments(*)')
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const scheduleData: Database['public']['Tables']['schedules']['Update'] = {
      ...body
    }

    const { data, error } = await supabase
      .from('schedules')
      .update(scheduleData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule update error:', error)
    return NextResponse.json(
      { error: 'Failed to update schedule' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('schedules')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Schedule delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete schedule' },
      { status: 500 }
    )
  }
} 
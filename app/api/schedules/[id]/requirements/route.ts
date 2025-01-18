/**
 * Schedule Requirements API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for schedule requirements.
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
      .select('*, requirements(*)')
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Schedule requirements fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule requirements' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const requirementData: Database['public']['Tables']['requirements']['Insert'] = {
      ...body,
      schedule_id: params.id
    }

    const { data, error } = await supabase
      .from('requirements')
      .insert(requirementData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Schedule requirement creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create schedule requirement' },
      { status: 500 }
    )
  }
}
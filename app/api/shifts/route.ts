/**
 * Shifts API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for shift records.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shifts')
      .select('*, employees(*), schedules(*)')
      .order('created_at', { ascending: false })

    if (error) {
      errorLogger('GET /api/shifts', error)
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Shifts fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch shifts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const shiftData: Database['public']['Tables']['shifts']['Insert'] = {
      ...body,
      status: 'pending'
    }

    const { data, error } = await supabase
      .from('shifts')
      .insert(shiftData)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Shift creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create shift' },
      { status: 500 }
    )
  }
}
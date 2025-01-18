/**
 * Requests API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for request records.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Requests fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .insert(body)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Request creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
} 
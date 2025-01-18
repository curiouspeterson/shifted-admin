/**
 * Request API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for individual request records.
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
      .from('requests')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Request fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const body = await request.json()
    const supabase = createClient()
    const { data, error } = await supabase
      .from('requests')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Request update error:', error)
    return NextResponse.json(
      { error: 'Failed to update request' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const supabase = createClient()
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw error
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Request delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
} 
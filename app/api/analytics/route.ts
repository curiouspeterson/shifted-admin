/**
 * Analytics API Route
 * Last Updated: 2025-03-19
 * 
 * Handles analytics data collection and retrieval.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('analytics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      errorLogger.error('Failed to fetch analytics:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const supabase = createClient()

    const analyticsData: Database['public']['Tables']['analytics']['Insert'] = {
      event_type: body.type,
      event_data: body.data,
    }

    const { error } = await supabase.from('analytics').insert([analyticsData])

    if (error) {
      errorLogger.error('Failed to save analytics:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to save analytics data' },
      { status: 500 }
    )
  }
} 
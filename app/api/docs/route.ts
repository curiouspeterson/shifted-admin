/**
 * Documentation API Route
 * Last Updated: 2025-03-19
 * 
 * Serves API documentation.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/client-side'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('docs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Documentation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    )
  }
} 
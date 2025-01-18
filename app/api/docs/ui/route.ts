/**
 * Documentation UI API Route
 * Last Updated: 2025-03-19
 * 
 * Serves documentation UI data.
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
      .eq('type', 'ui')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Documentation UI error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch UI documentation' },
      { status: 500 }
    )
  }
} 
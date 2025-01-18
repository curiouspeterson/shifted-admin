/**
 * Documentation UI API Route
 * Last Updated: 2025-03-19
 * 
 * Handles fetching UI documentation.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'
import type { Database } from '@/app/lib/supabase/database.types'

export async function GET() {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('docs')
      .select('*')
      .eq('type', 'ui')
      .order('created_at', { ascending: false })

    if (error) {
      errorLogger.error('Failed to fetch UI documentation', error, {
        context: {
          component: 'DocsUIAPI',
          action: 'GET'
        }
      })
      return NextResponse.json(
        { error: 'Failed to fetch UI documentation' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    errorLogger.error('Unexpected error in UI documentation API', error, {
      context: {
        component: 'DocsUIAPI',
        action: 'GET'
      }
    })
    return NextResponse.json(
      { error: 'Failed to fetch UI documentation' },
      { status: 500 }
    )
  }
} 
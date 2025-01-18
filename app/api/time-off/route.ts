/**
 * Time Off API Route
 * Last Updated: 2025-03-19
 * 
 * Handles CRUD operations for time-off requests.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { errorLogger } from '@/app/lib/logging/error-logger'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const employeeId = searchParams.get('employeeId')

  try {
    const supabase = createClient()
    let query = supabase.from('time_off_requests').select('*')

    if (status) {
      query = query.eq('status', status)
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    const { data, error } = await query

    if (error) {
      errorLogger.error('Failed to fetch time-off requests', error, {
        context: {
          component: 'TimeOffAPI',
          action: 'GET',
          params: { status, employeeId }
        }
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    errorLogger.error('Unexpected error in time-off requests API', error, {
      context: {
        component: 'TimeOffAPI',
        action: 'GET'
      }
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from('time_off_requests')
      .insert(body)
      .select()
      .single()

    if (error) {
      errorLogger.error('Failed to create time-off request', error, {
        context: {
          component: 'TimeOffAPI',
          action: 'POST',
          body
        }
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    errorLogger.error('Unexpected error in time-off requests API', error, {
      context: {
        component: 'TimeOffAPI',
        action: 'POST'
      }
    })
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 
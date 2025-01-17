/**
 * Time Requirements API Route
 * Last Updated: 2025-03-19
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { DayOfWeek } from '@/lib/schemas/api'
import { 
  listTimeRequirementsQuerySchema,
  createTimeRequirementSchema,
  updateTimeRequirementSchema 
} from '@/lib/schemas/api'
import { validateQuery } from '@/lib/api/validation'
import { ApiError } from '@/lib/errors'

// Type-safe column selection
const COLUMNS = '*' as const
const SELECT_OPTIONS = { count: 'exact' } as const

/**
 * Helper function to convert DayOfWeek enum to number
 */
function getDayOfWeekNumber(day: keyof typeof DayOfWeek): number {
  const value = DayOfWeek[day]
  return typeof value === 'number' ? value : 1 // Default to Monday if invalid
}

/**
 * GET /api/time-requirements
 * List time requirements with filtering and pagination
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = validateQuery(searchParams, listTimeRequirementsQuerySchema)
    const supabase = createClient()

    // Build the select query with count
    const selectQuery = supabase
      .from('time_requirements')
      .select(COLUMNS, SELECT_OPTIONS)

    // Handle optional filters with null checks
    const employeeId = query.employee_id === null ? null : query.employee_id?.trim() ?? null
    if (employeeId !== null) {
      selectQuery.eq('employee_id', employeeId)
    }

    const scheduleId = query.schedule_id === null ? null : query.schedule_id?.trim() ?? null
    if (scheduleId !== null) {
      selectQuery.eq('schedule_id', scheduleId)
    }

    const startDate = query.start_date === null ? null : query.start_date?.trim() ?? null
    if (startDate !== null) {
      selectQuery.gte('start_date', startDate)
    }

    const endDate = query.end_date === null ? null : query.end_date?.trim() ?? null
    if (endDate !== null) {
      selectQuery.lte('end_date', endDate)
    }

    if (query.status) {
      selectQuery.eq('status', query.status)
    }

    // Add pagination
    const from = (query.page - 1) * query.limit
    const to = from + query.limit - 1
    selectQuery.range(from, to)

    // Add sorting
    if (query.sort_by) {
      selectQuery.order(query.sort_by, {
        ascending: query.sort_order === 'asc'
      })
    }

    const { data, error, count } = await selectQuery

    if (error) {
      throw new ApiError({
        message: 'Failed to fetch time requirements',
        code: 'FETCH_ERROR',
        status: 500
      })
    }

    return NextResponse.json({
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total: count
      }
    })
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/time-requirements
 * Create a new time requirement
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = createTimeRequirementSchema.parse(body)
    const supabase = createClient()

    // Convert day_of_week enum to number
    const dayOfWeekNumber = getDayOfWeekNumber(validatedData.day_of_week)

    // Build the insert query
    const insertQuery = supabase
      .from('time_requirements')
      .insert({
        ...validatedData,
        day_of_week: dayOfWeekNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(COLUMNS, SELECT_OPTIONS)
      .single()

    const { data, error } = await insertQuery

    if (error) {
      throw new ApiError({
        message: 'Failed to create time requirement',
        code: 'CREATE_ERROR',
        status: 500
      })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/time-requirements/:id
 * Update an existing time requirement
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validatedData = updateTimeRequirementSchema.parse({
      ...body,
      id: params.id
    })
    const supabase = createClient()

    // If day_of_week is provided, convert enum to number
    let dayOfWeekNumber: number | undefined
    if (validatedData.day_of_week) {
      dayOfWeekNumber = getDayOfWeekNumber(validatedData.day_of_week)
    }

    // Build the update query
    const updateQuery = supabase
      .from('time_requirements')
      .update({
        ...validatedData,
        day_of_week: dayOfWeekNumber,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(COLUMNS, SELECT_OPTIONS)
      .single()

    const { data, error } = await updateQuery

    if (error) {
      throw new ApiError({
        message: 'Failed to update time requirement',
        code: 'UPDATE_ERROR',
        status: 500
      })
    }

    return NextResponse.json({ data })
  } catch (err: unknown) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.status }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
/**
 * Schedule Assignments List Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles schedule assignment list operations with rate limiting, validation, and pagination.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Rate limiter: 100 requests per minute
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'schedule-assignments-list'
})

// Validation schemas
const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.object({
    column: z.enum(['start_time', 'end_time', 'role', 'created_at']),
    ascending: z.boolean()
  }).optional(),
  employeeId: z.string().uuid().optional(),
  role: z.enum(['manager', 'employee']).optional()
})

const assignmentSchema = z.object({
  employeeId: z.string().uuid(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  role: z.enum(['manager', 'employee']),
  notes: z.string().optional()
})

interface Assignment {
  id: string
  employeeId: string
  scheduleId: string
  startTime: string
  endTime: string
  role: 'manager' | 'employee'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface AssignmentListResponse {
  assignments: Assignment[]
  total: number
  limit: number
  offset: number
}

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    query: queryParamsSchema
  },
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')
    const orderByValue = searchParams.get('orderBy')
    const ascendingValue = searchParams.get('ascending')
    
    if (typeof scheduleId !== 'string' || scheduleId === '') {
      return NextResponse.json<ApiResponse<AssignmentListResponse>>(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      )
    }

    const hasValidOrderBy = searchParams.has('orderBy') && 
      orderByValue !== null && 
      orderByValue !== ''

    const isAscending = ascendingValue !== null && 
      ascendingValue !== '' && 
      ascendingValue === 'true'

    const queryParams = queryParamsSchema.parse({
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      orderBy: hasValidOrderBy ? {
        column: orderByValue,
        ascending: isAscending
      } : undefined,
      employeeId: searchParams.get('employeeId'),
      role: searchParams.get('role')
    })

    const supabase = createClient(cookies())
    let query = supabase.from('schedule_assignments').select('*', { count: 'exact' })

    // Apply filters
    query = query.eq('schedule_id', scheduleId)

    if (typeof queryParams.employeeId === 'string' && queryParams.employeeId.trim() !== '') {
      query = query.eq('employee_id', queryParams.employeeId)
    }

    if (queryParams.role) {
      query = query.eq('role', queryParams.role)
    }

    // Apply pagination and ordering
    const { data, count, error } = await query
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)
      .order(queryParams.orderBy?.column || 'created_at', {
        ascending: queryParams.orderBy?.ascending ?? true
      })

    if (error !== null) {
      return NextResponse.json<ApiResponse<AssignmentListResponse>>(
        { error: error.message },
        { status: 400 }
      )
    }

    const total = typeof count === 'number' ? count : 0

    return NextResponse.json<ApiResponse<AssignmentListResponse>>({
      data: {
        assignments: data.map(item => ({
          id: item.id,
          employeeId: item.employee_id,
          scheduleId: item.schedule_id,
          startTime: item.start_time,
          endTime: item.end_time,
          role: item.role,
          notes: item.notes,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        })),
        total,
        limit: queryParams.limit,
        offset: queryParams.offset
      }
    })
  }
})

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: assignmentSchema
  },
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')

    if (typeof scheduleId !== 'string' || scheduleId === '') {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: 'Invalid schedule ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { employeeId, startTime, endTime, role, notes } = assignmentSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('schedule_assignments')
      .insert({
        schedule_id: scheduleId,
        employee_id: employeeId,
        start_time: startTime,
        end_time: endTime,
        role,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: error !== null ? error.message : 'Failed to create assignment' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<Assignment>>({
      data: {
        id: data.id,
        employeeId: data.employee_id,
        scheduleId: data.schedule_id,
        startTime: data.start_time,
        endTime: data.end_time,
        role: data.role,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })
  }
}) 
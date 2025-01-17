/**
 * Time Off Requests Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles time off request operations with rate limiting, validation, and pagination.
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
  keyPrefix: 'time-off'
})

// Validation schemas
const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.object({
    column: z.enum(['start_date', 'end_date', 'status', 'created_at']),
    ascending: z.boolean()
  }).optional(),
  employeeId: z.string().uuid().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
})

const timeOffRequestSchema = z.object({
  employeeId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['vacation', 'sick', 'personal', 'other']),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  notes: z.string().optional()
})

interface TimeOffRequest {
  id: string
  employeeId: string
  startDate: string
  endDate: string
  type: 'vacation' | 'sick' | 'personal' | 'other'
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface TimeOffRequestListResponse {
  requests: TimeOffRequest[]
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
    const orderByValue = searchParams.get('orderBy')
    const ascendingValue = searchParams.get('ascending')
    
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
      status: searchParams.get('status'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    })

    const supabase = createClient(cookies())
    let query = supabase.from('time_off_requests').select('*', { count: 'exact' })

    // Apply filters
    if (typeof queryParams.employeeId === 'string' && queryParams.employeeId.trim() !== '') {
      query = query.eq('employee_id', queryParams.employeeId)
    }

    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }

    if (typeof queryParams.startDate === 'string' && queryParams.startDate.trim() !== '') {
      query = query.gte('start_date', queryParams.startDate)
    }

    if (typeof queryParams.endDate === 'string' && queryParams.endDate.trim() !== '') {
      query = query.lte('end_date', queryParams.endDate)
    }

    // Apply pagination and ordering
    const { data, count, error } = await query
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)
      .order(queryParams.orderBy?.column || 'created_at', {
        ascending: queryParams.orderBy?.ascending ?? true
      })

    if (error !== null) {
      return NextResponse.json<ApiResponse<TimeOffRequestListResponse>>(
        { error: error.message },
        { status: 400 }
      )
    }

    const total = typeof count === 'number' ? count : 0

    return NextResponse.json<ApiResponse<TimeOffRequestListResponse>>({
      data: {
        requests: data.map(item => ({
          id: item.id,
          employeeId: item.employee_id,
          startDate: item.start_date,
          endDate: item.end_date,
          type: item.type,
          status: item.status,
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
    body: timeOffRequestSchema
  },
  handler: async (req) => {
    const body = await req.json()
    const { employeeId, startDate, endDate, type, status, notes } = timeOffRequestSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('time_off_requests')
      .insert({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        type,
        status,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<TimeOffRequest>>(
        { error: error !== null ? error.message : 'Failed to create time off request' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<TimeOffRequest>>({
      data: {
        id: data.id,
        employeeId: data.employee_id,
        startDate: data.start_date,
        endDate: data.end_date,
        type: data.type,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })
  }
}) 
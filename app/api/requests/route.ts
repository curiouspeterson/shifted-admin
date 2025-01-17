/**
 * Requests List Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles request list operations with rate limiting, validation, and pagination.
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
  keyPrefix: 'requests-list'
})

// Validation schemas
const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.object({
    column: z.enum(['title', 'description', 'status', 'priority', 'created_at']),
    ascending: z.boolean()
  }).optional(),
  search: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional()
})

const requestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['pending', 'approved', 'rejected']),
  priority: z.enum(['low', 'medium', 'high']),
  assignedTo: z.string().uuid().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional()
})

interface Request {
  id: string
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'low' | 'medium' | 'high'
  assignedTo?: string
  dueDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

interface RequestListResponse {
  requests: Request[]
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
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority')
    })

    const supabase = createClient(cookies())
    let query = supabase.from('requests').select('*', { count: 'exact' })

    // Apply filters
    if (queryParams.search) {
      query = query.or(
        `title.ilike.%${queryParams.search}%,` +
        `description.ilike.%${queryParams.search}%`
      )
    }

    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }

    if (queryParams.priority) {
      query = query.eq('priority', queryParams.priority)
    }

    // Apply pagination and ordering
    const { data, count, error } = await query
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)
      .order(queryParams.orderBy?.column || 'created_at', {
        ascending: queryParams.orderBy?.ascending ?? true
      })

    if (error !== null) {
      return NextResponse.json<ApiResponse<RequestListResponse>>(
        { error: error.message },
        { status: 400 }
      )
    }

    const total = typeof count === 'number' ? count : 0

    return NextResponse.json<ApiResponse<RequestListResponse>>({
      data: {
        requests: data.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          status: item.status,
          priority: item.priority,
          assignedTo: item.assigned_to,
          dueDate: item.due_date,
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
    body: requestSchema
  },
  handler: async (req) => {
    const body = await req.json()
    const { title, description, status, priority, assignedTo, dueDate, notes } = requestSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('requests')
      .insert({
        title,
        description,
        status,
        priority,
        assigned_to: assignedTo,
        due_date: dueDate,
        notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Request>>(
        { error: error !== null ? error.message : 'Failed to create request' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<Request>>({
      data: {
        id: data.id,
        title: data.title,
        description: data.description,
        status: data.status,
        priority: data.priority,
        assignedTo: data.assigned_to,
        dueDate: data.due_date,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })
  }
}) 
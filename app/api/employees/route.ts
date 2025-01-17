/**
 * Employee List Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles employee list operations with rate limiting, validation, and pagination.
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
  keyPrefix: 'employees-list'
})

// Validation schemas
const queryParamsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z.object({
    column: z.enum(['first_name', 'last_name', 'email', 'role', 'status', 'created_at']),
    ascending: z.boolean()
  }).optional(),
  search: z.string().trim().min(1).nullish(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  status: z.enum(['active', 'inactive']).optional()
})

interface Employee {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'admin' | 'manager' | 'employee'
  status: 'active' | 'inactive'
  notes?: string
  createdAt: string
  updatedAt: string
}

interface EmployeeListResponse {
  employees: Employee[]
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
      role: searchParams.get('role'),
      status: searchParams.get('status')
    })

    const supabase = createClient(cookies())
    let query = supabase.from('employees').select('*', { count: 'exact' })

    // Apply filters
    if (queryParams.search !== null && queryParams.search !== undefined) {
      query = query.or(
        `first_name.ilike.%${queryParams.search}%,` +
        `last_name.ilike.%${queryParams.search}%,` +
        `email.ilike.%${queryParams.search}%`
      )
    }

    if (queryParams.role) {
      query = query.eq('role', queryParams.role)
    }

    if (queryParams.status) {
      query = query.eq('status', queryParams.status)
    }

    // Apply pagination and ordering
    const { data, count, error } = await query
      .range(queryParams.offset, queryParams.offset + queryParams.limit - 1)
      .order(queryParams.orderBy?.column || 'created_at', {
        ascending: queryParams.orderBy?.ascending ?? true
      })

    if (error !== null) {
      return NextResponse.json<ApiResponse<EmployeeListResponse>>(
        { error: error.message },
        { status: 400 }
      )
    }

    const total = typeof count === 'number' ? count : 0

    return NextResponse.json<ApiResponse<EmployeeListResponse>>({
      data: {
        employees: data.map(item => ({
          id: item.id,
          firstName: item.first_name,
          lastName: item.last_name,
          email: item.email,
          phone: item.phone,
          role: item.role,
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
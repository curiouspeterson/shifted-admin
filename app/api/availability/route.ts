/**
 * Availability Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles employee availability management with rate limiting and validation.
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
  keyPrefix: 'availability'
})

// Validation schemas
const availabilitySchema = z.object({
  employeeId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  status: z.enum(['available', 'unavailable', 'preferred']),
  notes: z.string().optional()
})

interface AvailabilityResponse {
  id: string
  employeeId: string
  date: string
  startTime: string
  endTime: string
  status: 'available' | 'unavailable' | 'preferred'
  notes?: string
  createdAt: string
  updatedAt: string
}

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: availabilitySchema
  },
  handler: async (req) => {
    const body = await req.json()
    const { employeeId, date, startTime, endTime, status, notes } = availabilitySchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('availability')
      .insert({
        employee_id: employeeId,
        date,
        start_time: startTime,
        end_time: endTime,
        status,
        notes
      })
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<AvailabilityResponse>>(
        { error: error !== null ? error.message : 'Failed to create availability' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<AvailabilityResponse>>({
      data: {
        id: data.id,
        employeeId: data.employee_id,
        date: data.date,
        startTime: data.start_time,
        endTime: data.end_time,
        status: data.status,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }
    })
  }
})

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (typeof employeeId !== 'string' || employeeId === '' || 
        typeof startDate !== 'string' || startDate === '' || 
        typeof endDate !== 'string' || endDate === '') {
      return NextResponse.json<ApiResponse<AvailabilityResponse[]>>(
        { error: 'Missing required query parameters' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('availability')
      .select()
      .eq('employee_id', employeeId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error !== null) {
      return NextResponse.json<ApiResponse<AvailabilityResponse[]>>(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<AvailabilityResponse[]>>({
      data: data.map(item => ({
        id: item.id,
        employeeId: item.employee_id,
        date: item.date,
        startTime: item.start_time,
        endTime: item.end_time,
        status: item.status,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }))
    })
  }
}) 
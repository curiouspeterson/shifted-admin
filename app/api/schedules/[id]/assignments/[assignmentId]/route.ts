/**
 * Schedule Assignment Detail Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles individual schedule assignment operations with rate limiting and validation.
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
  keyPrefix: 'schedule-assignments'
})

// Validation schemas
const assignmentSchema = z.object({
  employeeId: z.string().uuid(),
  scheduleId: z.string().uuid(),
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

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')
    const assignmentId = searchParams.get('assignmentId')

    if (typeof scheduleId !== 'string' || scheduleId === '' ||
        typeof assignmentId !== 'string' || assignmentId === '') {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: 'Invalid schedule or assignment ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('schedule_assignments')
      .select()
      .eq('schedule_id', scheduleId)
      .eq('id', assignmentId)
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: error !== null ? error.message : 'Assignment not found' },
        { status: 404 }
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

export const PUT = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: assignmentSchema
  },
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')
    const assignmentId = searchParams.get('assignmentId')

    if (typeof scheduleId !== 'string' || scheduleId === '' ||
        typeof assignmentId !== 'string' || assignmentId === '') {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: 'Invalid schedule or assignment ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { employeeId, startTime, endTime, role, notes } = assignmentSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('schedule_assignments')
      .update({
        employee_id: employeeId,
        start_time: startTime,
        end_time: endTime,
        role,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('schedule_id', scheduleId)
      .eq('id', assignmentId)
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Assignment>>(
        { error: error !== null ? error.message : 'Failed to update assignment' },
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

export const DELETE = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')
    const assignmentId = searchParams.get('assignmentId')

    if (typeof scheduleId !== 'string' || scheduleId === '' ||
        typeof assignmentId !== 'string' || assignmentId === '') {
      return NextResponse.json<ApiResponse<{ success: boolean }>>(
        { error: 'Invalid schedule or assignment ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { error } = await supabase
      .from('schedule_assignments')
      .delete()
      .eq('schedule_id', scheduleId)
      .eq('id', assignmentId)

    if (error !== null) {
      return NextResponse.json<ApiResponse<{ success: boolean }>>(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<{ success: boolean }>>({
      data: { success: true }
    })
  }
}) 
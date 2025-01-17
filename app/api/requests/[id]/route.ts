/**
 * Request Detail Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles individual request operations with rate limiting and validation.
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
  keyPrefix: 'requests'
})

// Validation schemas
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

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (typeof id !== 'string' || id === '') {
      return NextResponse.json<ApiResponse<Request>>(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('requests')
      .select()
      .eq('id', id)
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Request>>(
        { error: error !== null ? error.message : 'Request not found' },
        { status: 404 }
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

export const PUT = createRouteHandler({
  rateLimit: rateLimiter,
  validate: {
    body: requestSchema
  },
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (typeof id !== 'string' || id === '') {
      return NextResponse.json<ApiResponse<Request>>(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { title, description, status, priority, assignedTo, dueDate, notes } = requestSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('requests')
      .update({
        title,
        description,
        status,
        priority,
        assigned_to: assignedTo,
        due_date: dueDate,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Request>>(
        { error: error !== null ? error.message : 'Failed to update request' },
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

export const DELETE = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (typeof id !== 'string' || id === '') {
      return NextResponse.json<ApiResponse<{ success: boolean }>>(
        { error: 'Invalid request ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', id)

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
/**
 * Employee Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles employee CRUD operations with rate limiting and validation.
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
  keyPrefix: 'employees'
})

// Validation schemas
const employeeSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  status: z.enum(['active', 'inactive']),
  notes: z.string().optional()
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

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (typeof id !== 'string' || id === '') {
      return NextResponse.json<ApiResponse<Employee>>(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('employees')
      .select()
      .eq('id', id)
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Employee>>(
        { error: error !== null ? error.message : 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json<ApiResponse<Employee>>({
      data: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
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
    body: employeeSchema
  },
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (typeof id !== 'string' || id === '') {
      return NextResponse.json<ApiResponse<Employee>>(
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { firstName, lastName, email, phone, role, status, notes } = employeeSchema.parse(body)

    const supabase = createClient(cookies())
    
    const { data, error } = await supabase
      .from('employees')
      .update({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        role,
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error !== null || data === null) {
      return NextResponse.json<ApiResponse<Employee>>(
        { error: error !== null ? error.message : 'Failed to update employee' },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse<Employee>>({
      data: {
        id: data.id,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        status: data.status,
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
        { error: 'Invalid employee ID' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    
    const { error } = await supabase
      .from('employees')
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
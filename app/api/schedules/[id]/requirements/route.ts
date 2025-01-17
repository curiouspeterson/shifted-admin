/**
 * Schedule Requirements Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles CRUD operations for schedule requirements with rate limiting.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler } from '@/lib/api'
import { createClient } from '@/lib/supabase/server'
import { TimeRequirementsOperations } from '@/lib/operations/time-requirements'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Rate limiter: 100 requests per minute
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'schedule-requirements'
})

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')

    if (scheduleId === null || scheduleId.trim() === '') {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(cookies())
    const timeRequirements = new TimeRequirementsOperations(supabase)
    const { data, error } = await timeRequirements.getByScheduleId(scheduleId)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  }
})

export const POST = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const { searchParams } = new URL(req.url)
    const scheduleId = searchParams.get('scheduleId')

    if (scheduleId === null || scheduleId.trim() === '') {
      return NextResponse.json(
        { error: 'Schedule ID is required' },
        { status: 400 }
      )
    }

    try {
      // Parse request body
      const requirement = await req.json()

      // Create Supabase client
      const supabase = createClient(cookies())

      // Initialize database operations
      const timeRequirements = new TimeRequirementsOperations(supabase)

      // Create requirement
      const { data: newRequirement, error } = await timeRequirements.create({
        ...requirement,
        schedule_id: scheduleId
      })

      if (error !== null && typeof error === 'object') {
        return NextResponse.json(
          { 
            error: error.message,
            details: 'details' in error ? error.details : undefined,
            code: 'requirements/create-failed'
          },
          { status: 400 }
        )
      }

      return NextResponse.json({ data: newRequirement })
    } catch (error) {
      console.error('Requirement creation error:', error)
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : 'Failed to create requirement',
          code: 'requirements/unknown-error'
        },
        { status: 500 }
      )
    }
  }
})
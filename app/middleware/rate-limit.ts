/**
 * Rate Limiting Middleware
 * Last Updated: 2025-03-19
 * 
 * Implements rate limiting for authentication operations.
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { errorLogger } from '@/app/lib/logging/error-logger'

// In-memory store for rate limiting
// Note: In production, use Redis or similar for distributed systems
const rateLimitStore = new Map<string, { count: number; timestamp: number }>()

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const MAX_REQUESTS = 100 // Maximum requests per window
const AUTH_RATE_LIMIT = 5 // Stricter limit for auth endpoints

export function rateLimit(req: NextRequest) {
  try {
    const ip = req.ip ?? 'anonymous'
    const isAuthRoute = req.nextUrl.pathname.startsWith('/auth') || 
                       req.nextUrl.pathname.includes('sign-in') || 
                       req.nextUrl.pathname.includes('sign-up')
    
    const now = Date.now()
    const windowData = rateLimitStore.get(ip)
    
    // Clean up old entries
    if (windowData && now - windowData.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitStore.delete(ip)
    }
    
    // Initialize or get current window data
    const currentWindow = rateLimitStore.get(ip) ?? { count: 0, timestamp: now }
    const limit = isAuthRoute ? AUTH_RATE_LIMIT : MAX_REQUESTS
    
    // Increment request count
    currentWindow.count++
    rateLimitStore.set(ip, currentWindow)
    
    // Check if rate limit exceeded
    if (currentWindow.count > limit) {
      errorLogger.error('Rate limit exceeded:', {
        ip,
        route: req.nextUrl.pathname,
        count: currentWindow.count,
        limit,
        severity: 'warning'
      })
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil((RATE_LIMIT_WINDOW - (now - currentWindow.timestamp)) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((RATE_LIMIT_WINDOW - (now - currentWindow.timestamp)) / 1000).toString()
          }
        }
      )
    }
    
    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', limit.toString())
    headers.set('X-RateLimit-Remaining', (limit - currentWindow.count).toString())
    headers.set('X-RateLimit-Reset', (currentWindow.timestamp + RATE_LIMIT_WINDOW).toString())
    
    return { headers }
  } catch (error) {
    errorLogger.error('Rate limiting error:', { error })
    return null
  }
} 
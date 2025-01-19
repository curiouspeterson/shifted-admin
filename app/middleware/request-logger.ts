/**
 * Request Logger Middleware
 * Last Updated: 2025-03-19
 * 
 * Implements request logging with performance metrics and error tracking.
 */

import type { NextRequest } from 'next/server'
import { errorLogger } from '@/app/lib/logging/error-logger'

export async function requestLogger(req: NextRequest) {
  const startTime = performance.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Extract useful request information
    const { method, url, referrer, headers: reqHeaders } = req
    const userAgent = reqHeaders.get('user-agent')
    const ip = req.ip ?? 'anonymous'
    const path = new URL(url).pathname
    
    // Log request start
    errorLogger.error('Request started:', {
      requestId,
      method,
      path,
      ip,
      userAgent,
      referrer,
      severity: 'info',
      timestamp: new Date().toISOString()
    })
    
    // Add tracking headers
    const responseHeaders = new Headers()
    responseHeaders.set('X-Request-ID', requestId)
    responseHeaders.set('Server-Timing', `start;dur=${performance.now() - startTime}`)
    
    // Add security headers
    responseHeaders.set('X-Content-Type-Options', 'nosniff')
    responseHeaders.set('X-Frame-Options', 'DENY')
    responseHeaders.set('X-XSS-Protection', '1; mode=block')
    responseHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    if (process.env.NODE_ENV === 'production') {
      responseHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
      responseHeaders.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';")
    }
    
    return { headers: responseHeaders }
  } catch (error) {
    errorLogger.error('Request logging error:', {
      error,
      requestId,
      duration: performance.now() - startTime
    })
    return null
  } finally {
    // Log request completion
    errorLogger.error('Request completed:', {
      requestId,
      duration: performance.now() - startTime,
      severity: 'info',
      timestamp: new Date().toISOString()
    })
  }
} 
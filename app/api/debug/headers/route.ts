/**
 * Debug Headers Route Handler
 * Last Updated: 2025-01-17
 * 
 * Provides detailed information about request headers for debugging purposes.
 */

import { RateLimiter } from '@/lib/rate-limiting'
import { createRouteHandler, type ApiResponse } from '@/lib/api'
import { NextResponse } from 'next/server'

// Rate limiter: 10 requests per minute
const rateLimiter = new RateLimiter({
  points: 10,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'debug-headers'
})

interface HeaderInfo {
  name: string
  value: string
  size: number
  truncated: boolean
}

interface DebugHeadersResponse {
  headers: HeaderInfo[]
  totalSize: number
  count: number
  timestamp: string
}

export const GET = createRouteHandler({
  rateLimit: rateLimiter,
  handler: async (req) => {
    const headers: HeaderInfo[] = []
    let totalSize = 0

    // Process each header
    req.headers.forEach((value, name) => {
      const headerSize = name.length + value.length
      totalSize += headerSize

      headers.push({
        name,
        value: value.length > 100 ? `${value.slice(0, 97)}...` : value,
        size: headerSize,
        truncated: value.length > 100
      })
    })

    // Sort headers by size (largest first)
    headers.sort((a, b) => b.size - a.size)

    return NextResponse.json<ApiResponse<DebugHeadersResponse>>({
      data: {
        headers,
        totalSize,
        count: headers.length,
        timestamp: new Date().toISOString()
      }
    })
  }
}) 
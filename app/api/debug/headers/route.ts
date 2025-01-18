/**
 * Debug Headers API Route
 * Last Updated: 2025-03-19
 * 
 * Displays request headers for debugging purposes.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function GET() {
  try {
    const headersList = headers()
    const headerData = Object.fromEntries(headersList.entries())

    return NextResponse.json(headerData)
  } catch (error) {
    console.error('Debug headers error:', error)
    return NextResponse.json(
      { error: 'Failed to get headers' },
      { status: 500 }
    )
  }
} 
/**
 * Sentry Example API Route
 * Last Updated: 2025-03-19
 * 
 * Example route demonstrating Sentry error tracking.
 */

import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'

export async function GET() {
  try {
    throw new Error('Sentry Example API Route Error')
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown) {
  console.error('Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof PostgrestError) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
    { status: 500 }
  )
}

export function handleAuthError(error: unknown) {
  console.error('Auth error:', error)
  
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Authentication failed' },
    { status: 401 }
  )
}

export function handleValidationError(error: unknown) {
  console.error('Validation error:', error)
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Validation failed' },
    { status: 400 }
  )
}

export function handleDatabaseError(error: unknown) {
  console.error('Database error:', error)
  
  if (error instanceof PostgrestError) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Database operation failed' },
    { status: 500 }
  )
} 
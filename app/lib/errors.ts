/**
 * Error Handling Utilities
 * Last Updated: 2024
 * 
 * This file provides a centralized error handling system for the application.
 * It includes:
 * - Custom error class for application-specific errors
 * - Error handlers for different types of errors (general, auth, validation, database)
 * - Consistent error response formatting
 * 
 * All error handlers return NextResponse objects with appropriate status codes
 * and formatted error messages.
 */

import { NextResponse } from 'next/server'
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Custom Application Error Class
 * Extends the base Error class with additional properties for HTTP status codes
 * and error codes for more specific error handling
 */
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

/**
 * General Error Handler
 * Handles any type of error and returns an appropriate response
 * Supports:
 * - AppError: Uses provided status code and message
 * - PostgrestError: Database-specific errors
 * - Generic errors: Converts to 500 Internal Server Error
 */
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

/**
 * Authentication Error Handler
 * Specifically handles authentication-related errors
 * Returns 401 Unauthorized for generic auth errors
 */
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

/**
 * Validation Error Handler
 * Handles errors related to input validation
 * Always returns 400 Bad Request with validation error details
 */
export function handleValidationError(error: unknown) {
  console.error('Validation error:', error)
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Validation failed' },
    { status: 400 }
  )
}

/**
 * Database Error Handler
 * Specifically handles database-related errors
 * Provides special handling for Postgrest errors
 * Returns 500 Internal Server Error for database issues
 */
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
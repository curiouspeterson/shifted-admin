/**
 * Database Error Handling
 * Last Updated: 2025-01-16
 * 
 * Error handling utilities for database operations with Supabase integration.
 */

import { PostgrestError } from '@supabase/supabase-js'
import { AppError } from './base'

/**
 * Database error codes
 */
export enum DatabaseErrorCode {
  UNIQUE_VIOLATION = '23505',
  FOREIGN_KEY_VIOLATION = '23503',
  NOT_NULL_VIOLATION = '23502',
  CHECK_VIOLATION = '23514',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR'
}

/**
 * Postgres error details
 */
interface PostgresErrorDetails {
  code: string
  message: string
  details?: string
  hint?: string
}

/**
 * Database error class
 */
export class DatabaseError extends AppError {
  constructor(
    message: string,
    public pgError?: PostgrestError,
    details?: Record<string, unknown>
  ) {
    const pgCode = pgError?.code as DatabaseErrorCode
    const statusCode = getStatusCodeFromPgError(pgCode)
    
    const errorDetails: Record<string, unknown> = {
      ...details,
      pgError: pgError ? {
        code: pgError.code,
        message: pgError.message,
        details: pgError.details,
        hint: pgError.hint
      } : undefined
    }
    
    super(message, `DATABASE_${pgCode || 'ERROR'}`, statusCode, errorDetails)
    this.name = 'DatabaseError'
  }
}

/**
 * Get HTTP status code from Postgres error code
 */
function getStatusCodeFromPgError(code?: DatabaseErrorCode): number {
  switch (code) {
    case DatabaseErrorCode.UNIQUE_VIOLATION:
      return 409 // Conflict
    case DatabaseErrorCode.FOREIGN_KEY_VIOLATION:
      return 409 // Conflict
    case DatabaseErrorCode.NOT_NULL_VIOLATION:
      return 400 // Bad Request
    case DatabaseErrorCode.CHECK_VIOLATION:
      return 400 // Bad Request
    case DatabaseErrorCode.CONNECTION_ERROR:
      return 503 // Service Unavailable
    case DatabaseErrorCode.TIMEOUT_ERROR:
      return 504 // Gateway Timeout
    default:
      return 500 // Internal Server Error
  }
}

/**
 * Create a database error from Supabase error
 */
export function createDatabaseError(
  error: PostgrestError,
  message?: string
): DatabaseError {
  // Handle specific error cases
  switch (error.code as DatabaseErrorCode) {
    case DatabaseErrorCode.UNIQUE_VIOLATION:
      return new DatabaseError(
        message || 'A record with this value already exists',
        error
      )
    
    case DatabaseErrorCode.FOREIGN_KEY_VIOLATION:
      return new DatabaseError(
        message || 'Referenced record does not exist',
        error
      )
    
    case DatabaseErrorCode.NOT_NULL_VIOLATION:
      return new DatabaseError(
        message || 'Required field is missing',
        error
      )
    
    case DatabaseErrorCode.CHECK_VIOLATION:
      return new DatabaseError(
        message || 'Value violates check constraint',
        error
      )
    
    default:
      return new DatabaseError(
        message || 'Database operation failed',
        error
      )
  }
}

/**
 * Handle database operation with error handling
 */
export async function withDatabaseError<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<T> {
  const { data, error } = await operation()
  
  if (error) {
    throw createDatabaseError(error)
  }
  
  if (data === null) {
    throw new DatabaseError('No data returned from database')
  }
  
  return data
}

/**
 * Type guard for Supabase PostgrestError
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
} 
/**
 * Database Error Mapper
 * Last Updated: 2024-01-15
 * 
 * Maps database errors to our custom DatabaseError type with proper context.
 */

import { PostgrestError } from '@supabase/supabase-js'
import { DatabaseError, ErrorCode, ErrorContext } from './errors'

/**
 * Map a database error to our custom DatabaseError type
 */
export function mapDatabaseError(error: unknown, context?: ErrorContext): DatabaseError {
  // Handle PostgrestError
  if (error instanceof PostgrestError) {
    return mapPostgrestError(error, context)
  }

  // Handle DatabaseError
  if (error instanceof DatabaseError) {
    return error
  }

  // Handle Error
  if (error instanceof Error) {
    return new DatabaseError({
      code: ErrorCode.UNKNOWN,
      message: error.message,
      cause: error,
      context,
      retryable: false
    })
  }

  // Handle unknown error
  return new DatabaseError({
    code: ErrorCode.UNKNOWN,
    message: String(error),
    context,
    retryable: false
  })
}

/**
 * Map a PostgrestError to our custom DatabaseError type
 */
function mapPostgrestError(error: PostgrestError, context?: ErrorContext): DatabaseError {
  const { code, message, details, hint } = error

  // Map common Postgres error codes
  switch (code) {
    case '23505': // unique_violation
      return new DatabaseError({
        code: ErrorCode.CONSTRAINT_VIOLATION,
        message: 'Unique constraint violation',
        context: {
          ...context,
          details,
          hint
        },
        retryable: false
      })

    case '23503': // foreign_key_violation
      return new DatabaseError({
        code: ErrorCode.CONSTRAINT_VIOLATION,
        message: 'Foreign key constraint violation',
        context: {
          ...context,
          details,
          hint
        },
        retryable: false
      })

    case '40001': // serialization_failure
      return new DatabaseError({
        code: ErrorCode.SERIALIZATION_FAILURE,
        message: 'Transaction serialization failed',
        context: {
          ...context,
          details,
          hint
        },
        retryable: true
      })

    case '40P01': // deadlock_detected
      return new DatabaseError({
        code: ErrorCode.DEADLOCK_DETECTED,
        message: 'Deadlock detected',
        context: {
          ...context,
          details,
          hint
        },
        retryable: true
      })

    case 'PGRST116': // not_found
      return new DatabaseError({
        code: ErrorCode.RECORD_NOT_FOUND,
        message: 'Record not found',
        context: {
          ...context,
          details,
          hint
        },
        retryable: false
      })

    default:
      return new DatabaseError({
        code: ErrorCode.UNKNOWN,
        message: message || 'Unknown database error',
        context: {
          ...context,
          details,
          hint
        },
        retryable: false
      })
  }
} 
/**
 * Database Error Mapper
 * Last Updated: 2024-01-16
 * 
 * Maps database errors to our custom DatabaseError type with proper context and type safety.
 * Includes enhanced Supabase error handling.
 */

import { PostgrestError } from '@supabase/supabase-js'
import { DatabaseError, ErrorCode, ErrorContext } from './errors'

/**
 * Type guard for PostgrestError
 */
function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    error instanceof PostgrestError ||
    (typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error)
  )
}

/**
 * Type guard for Supabase auth errors
 */
function isSupabaseAuthError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false
  const err = error as Record<string, unknown>
  return (
    'status' in err &&
    typeof err.status === 'number' &&
    err.status >= 400 &&
    err.status < 500 &&
    'error_description' in err &&
    typeof err.error_description === 'string' &&
    err.error_description.toLowerCase().includes('auth')
  )
}

/**
 * Check if a PostgrestError is an RLS error
 */
function checkRLSError(error: PostgrestError): boolean {
  const message = error.message?.toLowerCase() || ''
  const details = error.details?.toLowerCase() || ''
  return (
    error.code === '42501' || // insufficient_privilege
    message.includes('policy') ||
    details.includes('policy')
  )
}

/**
 * Type guard for Supabase RLS errors
 */
function isSupabaseRLSError(error: unknown): error is PostgrestError {
  if (!isPostgrestError(error)) return false
  return checkRLSError(error)
}

/**
 * Type guard for Supabase rate limit errors
 */
function isSupabaseRateLimitError(error: unknown): boolean {
  if (typeof error !== 'object' || !error) return false
  const err = error as Record<string, unknown>
  return (
    'status' in err &&
    err.status === 429 &&
    'message' in err &&
    typeof err.message === 'string' &&
    err.message.toLowerCase().includes('rate limit')
  )
}

/**
 * Map a database error to our custom DatabaseError type with enhanced context
 */
export function mapDatabaseError(
  error: unknown, 
  context?: ErrorContext
): DatabaseError {
  // Handle Supabase auth errors
  if (isSupabaseAuthError(error)) {
    const err = error as Record<string, unknown>
    return new DatabaseError({
      code: err.message?.toString().includes('expired') 
        ? ErrorCode.AUTH_EXPIRED_TOKEN 
        : ErrorCode.AUTH_ERROR,
      message: err.error_description?.toString() || 'Authentication error',
      context: {
        ...context,
        supabase: {
          statusCode: err.status as number,
          errorType: err.error?.toString(),
          session: context?.supabase?.session
        }
      },
      retryable: false
    })
  }

  // Handle Supabase RLS errors
  if (isSupabaseRLSError(error)) {
    return new DatabaseError({
      code: ErrorCode.RLS_POLICY_VIOLATION,
      message: 'Row level security policy violation',
      context: {
        ...context,
        supabase: {
          ...context?.supabase,
          rls: {
            policy: error.details,
            schema: context?.table?.split('.')[0],
            table: context?.table?.split('.')[1],
            action: context?.operation?.type
          }
        }
      },
      retryable: false
    })
  }

  // Handle Supabase rate limit errors
  if (isSupabaseRateLimitError(error)) {
    const err = error as Record<string, unknown>
    return new DatabaseError({
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: err.message?.toString() || 'Rate limit exceeded',
      context: {
        ...context,
        supabase: {
          statusCode: err.status as number,
          headers: err.headers as Record<string, string>
        }
      },
      retryable: true
    })
  }

  // Handle PostgrestError
  if (isPostgrestError(error)) {
    return mapPostgrestError(error, context)
  }

  // Handle DatabaseError
  if (error instanceof DatabaseError) {
    return new DatabaseError({
      code: error.code,
      message: error.message,
      context: {
        ...error.context,
        ...context
      },
      cause: error.cause,
      retryable: error.retryable
    })
  }

  // Handle Error
  if (error instanceof Error) {
    return new DatabaseError({
      code: ErrorCode.UNKNOWN,
      message: error.message,
      cause: error,
      context,
      retryable: isRetryableError(error)
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
 * Map a PostgrestError to our custom DatabaseError type with enhanced context
 */
function mapPostgrestError(
  error: PostgrestError, 
  context?: ErrorContext
): DatabaseError {
  const { code, message, details, hint } = error

  // Enhance context with database-specific information
  const enhancedContext: ErrorContext = {
    ...context,
    database: {
      code,
      details,
      hint
    }
  }

  // Map common Postgres error codes
  switch (code) {
    // Constraint Violations
    case '23505': // unique_violation
      return new DatabaseError({
        code: ErrorCode.UNIQUE_VIOLATION,
        message: 'Unique constraint violation',
        context: enhancedContext,
        retryable: false
      })

    case '23503': // foreign_key_violation
      return new DatabaseError({
        code: ErrorCode.FOREIGN_KEY_VIOLATION,
        message: 'Foreign key constraint violation',
        context: enhancedContext,
        retryable: false
      })

    case '23514': // check_violation
      return new DatabaseError({
        code: ErrorCode.CHECK_VIOLATION,
        message: 'Check constraint violation',
        context: enhancedContext,
        retryable: false
      })

    // Transaction Errors
    case '40001': // serialization_failure
      return new DatabaseError({
        code: ErrorCode.SERIALIZATION_FAILURE,
        message: 'Transaction serialization failed',
        context: enhancedContext,
        retryable: true
      })

    case '40P01': // deadlock_detected
      return new DatabaseError({
        code: ErrorCode.DEADLOCK_DETECTED,
        message: 'Deadlock detected',
        context: enhancedContext,
        retryable: true
      })

    // Connection Errors
    case '08006': // connection_failure
      return new DatabaseError({
        code: ErrorCode.CONNECTION_ERROR,
        message: 'Database connection failed',
        context: enhancedContext,
        retryable: true
      })

    case '08003': // connection_does_not_exist
      return new DatabaseError({
        code: ErrorCode.CONNECTION_ERROR,
        message: 'Connection does not exist',
        context: enhancedContext,
        retryable: true
      })

    // PostgREST Errors
    case 'PGRST116': // not_found
      return new DatabaseError({
        code: ErrorCode.RECORD_NOT_FOUND,
        message: 'Record not found',
        context: enhancedContext,
        retryable: false
      })

    case 'PGRST201': // permission_denied
      return new DatabaseError({
        code: ErrorCode.PERMISSION_DENIED,
        message: 'Permission denied',
        context: enhancedContext,
        retryable: false
      })

    // Default case
    default:
      return new DatabaseError({
        code: ErrorCode.UNKNOWN,
        message: message || 'Unknown database error',
        context: enhancedContext,
        retryable: isRetryableError(error)
      })
  }
}

/**
 * Determine if an error is retryable based on its characteristics
 */
function isRetryableError(error: unknown): boolean {
  // Network-related errors are usually retryable
  if (error instanceof Error) {
    const networkErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'ENOTFOUND',
      'ENETUNREACH'
    ]
    return networkErrors.some(code => error.message.includes(code))
  }

  // PostgrestError with specific codes
  if (isPostgrestError(error)) {
    const retryCodes = [
      '40001', // serialization_failure
      '40P01', // deadlock_detected
      '08006', // connection_failure
      '08003', // connection_does_not_exist
      'XX000'  // internal_error
    ]
    return retryCodes.includes(error.code)
  }

  // Supabase rate limit errors are retryable
  if (isSupabaseRateLimitError(error)) {
    return true
  }

  return false
} 
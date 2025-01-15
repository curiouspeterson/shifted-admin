/**
 * Database Error Types
 * Last Updated: 2024-03-20
 * 
 * This module defines custom error types for database operations
 * with enhanced error context and recovery strategies.
 */

export enum ErrorCode {
  // Not Found
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  
  // Validation
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',
  
  // Concurrency
  OPTIMISTIC_LOCK_FAILED = 'OPTIMISTIC_LOCK_FAILED',
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE',
  DEADLOCK_DETECTED = 'DEADLOCK_DETECTED',
  
  // Connection
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Transaction
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  
  // Unknown
  UNKNOWN = 'UNKNOWN'
}

export interface ErrorContext {
  tableName?: string
  operation?: string
  id?: string | number
  requestId?: string
  timestamp?: string
  duration?: number
  attempt?: number
  details?: unknown
  hint?: string
  metadata?: Record<string, unknown>
}

export interface ErrorDetails {
  code: ErrorCode
  message: string
  cause?: Error
  context?: ErrorContext
  retryable?: boolean
  statusCode?: number
}

export class DatabaseError extends Error {
  readonly code: ErrorCode
  readonly context?: ErrorContext
  readonly retryable: boolean
  readonly statusCode: number
  readonly cause?: Error

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'DatabaseError'
    this.code = details.code
    this.context = details.context
    this.retryable = details.retryable ?? false
    this.statusCode = details.statusCode ?? 500
    this.cause = details.cause
  }

  /**
   * Check if error is retryable
   */
  isRetryable(): boolean {
    return this.retryable
  }

  /**
   * Get error details for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      retryable: this.retryable,
      statusCode: this.statusCode,
      cause: this.cause instanceof Error ? {
        name: this.cause.name,
        message: this.cause.message,
        stack: this.cause.stack
      } : undefined,
      stack: this.stack
    }
  }
}

/**
 * Create a not found error
 */
export function createNotFoundError(
  tableName: string,
  id: string | number,
  context?: Partial<ErrorContext>
): DatabaseError {
  return new DatabaseError({
    code: ErrorCode.RECORD_NOT_FOUND,
    message: `Record not found in table '${tableName}' with id '${id}'`,
    context: {
      tableName,
      id,
      ...context
    },
    retryable: false,
    statusCode: 404
  })
}

/**
 * Create a validation error
 */
export function createValidationError(
  message: string,
  context?: Partial<ErrorContext>
): DatabaseError {
  return new DatabaseError({
    code: ErrorCode.VALIDATION_FAILED,
    message,
    context,
    retryable: false,
    statusCode: 400
  })
}

/**
 * Create a concurrency error
 */
export function createConcurrencyError(
  code: ErrorCode.OPTIMISTIC_LOCK_FAILED | ErrorCode.SERIALIZATION_FAILURE | ErrorCode.DEADLOCK_DETECTED,
  message: string,
  context?: Partial<ErrorContext>
): DatabaseError {
  return new DatabaseError({
    code,
    message,
    context,
    retryable: true,
    statusCode: 409
  })
}

/**
 * Create a connection error
 */
export function createConnectionError(
  message: string,
  cause?: Error,
  context?: Partial<ErrorContext>
): DatabaseError {
  return new DatabaseError({
    code: ErrorCode.CONNECTION_ERROR,
    message,
    cause,
    context,
    retryable: true,
    statusCode: 503
  })
}

interface PostgresError {
  code: string
  message?: string
  details?: unknown
  hint?: string
  [key: string]: unknown
}

function isPostgresError(error: unknown): error is PostgresError {
  return (
    error !== null &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as any).code === 'string'
  )
}

/**
 * Map a database error from any source
 */
export function mapDatabaseError(error: unknown, context?: Partial<ErrorContext>): DatabaseError {
  // Already a DatabaseError
  if (error instanceof DatabaseError) {
    return error
  }

  // PostgreSQL error codes
  if (isPostgresError(error)) {
    switch (error.code) {
      case '23505': // unique_violation
        return new DatabaseError({
          code: ErrorCode.CONSTRAINT_VIOLATION,
          message: error.message ?? 'Unique constraint violation',
          cause: new Error(error.message ?? 'Unique constraint violation'),
          context: {
            ...context,
            details: error.details,
            hint: error.hint
          },
          retryable: false,
          statusCode: 409
        })
      
      case '40001': // serialization_failure
        return new DatabaseError({
          code: ErrorCode.SERIALIZATION_FAILURE,
          message: error.message ?? 'Transaction serialization failed',
          cause: new Error(error.message ?? 'Transaction serialization failed'),
          context: {
            ...context,
            details: error.details,
            hint: error.hint
          },
          retryable: true,
          statusCode: 409
        })
      
      case '40P01': // deadlock_detected
        return new DatabaseError({
          code: ErrorCode.DEADLOCK_DETECTED,
          message: error.message ?? 'Deadlock detected',
          cause: new Error(error.message ?? 'Deadlock detected'),
          context: {
            ...context,
            details: error.details,
            hint: error.hint
          },
          retryable: true,
          statusCode: 409
        })
    }
  }

  // Generic error
  return new DatabaseError({
    code: ErrorCode.UNKNOWN,
    message: error instanceof Error ? error.message : String(error),
    cause: error instanceof Error ? error : new Error(String(error)),
    context,
    retryable: false,
    statusCode: 500
  })
} 
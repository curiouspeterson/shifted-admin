/**
 * Database Error Types
 * Last Updated: 2024-01-16
 * 
 * Defines error types and codes for database operations with enhanced type safety.
 * Includes Supabase-specific error handling with comprehensive RLS support.
 */

export enum ErrorCode {
  // Generic errors
  UNKNOWN = 'UNKNOWN',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  // Database operation errors
  NOT_FOUND = 'NOT_FOUND',
  INSERT_FAILED = 'INSERT_FAILED',
  UPDATE_FAILED = 'UPDATE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // Constraint errors
  UNIQUE_VIOLATION = 'UNIQUE_VIOLATION',
  FOREIGN_KEY_VIOLATION = 'FOREIGN_KEY_VIOLATION',
  CHECK_VIOLATION = 'CHECK_VIOLATION',
  
  // Transaction errors
  TRANSACTION_FAILED = 'TRANSACTION_FAILED',
  DEADLOCK_DETECTED = 'DEADLOCK_DETECTED',
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE',
  
  // Connection errors
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PRIVILEGES = 'INSUFFICIENT_PRIVILEGES',
  
  // Record errors
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  RECORD_MODIFIED = 'RECORD_MODIFIED',
  RECORD_LOCKED = 'RECORD_LOCKED',

  // Supabase-specific errors
  AUTH_ERROR = 'AUTH_ERROR',
  AUTH_INVALID_TOKEN = 'AUTH_INVALID_TOKEN',
  AUTH_EXPIRED_TOKEN = 'AUTH_EXPIRED_TOKEN',
  RLS_POLICY_VIOLATION = 'RLS_POLICY_VIOLATION',
  REALTIME_ERROR = 'REALTIME_ERROR',
  REALTIME_SUBSCRIPTION_ERROR = 'REALTIME_SUBSCRIPTION_ERROR',
  EDGE_FUNCTION_ERROR = 'EDGE_FUNCTION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Enhanced RLS error codes
  RLS_POLICY_MISSING = 'RLS_POLICY_MISSING',
  RLS_POLICY_INVALID = 'RLS_POLICY_INVALID',
  RLS_POLICY_FUNCTION_ERROR = 'RLS_POLICY_FUNCTION_ERROR',
  RLS_POLICY_PERFORMANCE_ERROR = 'RLS_POLICY_PERFORMANCE_ERROR',
  RLS_ROLE_ERROR = 'RLS_ROLE_ERROR'
}

/**
 * Base error context interface
 */
export interface ErrorContext {
  // Generic context
  message?: string
  originalError?: unknown
  timestamp?: string
  
  // Database context
  table?: string
  column?: string
  value?: unknown
  constraint?: string
  
  // Operation context
  operation?: {
    type: 'query' | 'insert' | 'update' | 'delete'
    table: string
    timestamp: string
  }
  id?: string
  data?: unknown
  filters?: unknown
  
  // Database specific context
  database?: {
    code: string
    details?: string
    hint?: string
  }
  
  // Retry context
  retry?: {
    attempt: number
    maxAttempts: number
    delay: number
  }

  // Supabase-specific context
  supabase?: {
    statusCode?: number
    errorType?: string
    path?: string
    method?: string
    headers?: Record<string, string>
    params?: Record<string, unknown>
    session?: {
      user?: string
      role?: string
      claims?: Record<string, unknown>
    }
    rls?: {
      policy?: string
      schema?: string
      table?: string
      action?: string
      // Enhanced RLS context
      function?: {
        name: string
        args?: Record<string, unknown>
        execution_time?: number
        cache_hit?: boolean
        error?: string
      }
      validation?: {
        status: 'valid' | 'invalid' | 'missing'
        issues?: string[]
        last_validated?: string
      }
      role?: {
        name: string
        permissions: string[]
        inherited_roles?: string[]
        active_policies?: string[]
      }
      performance?: {
        query_planning_time?: number
        execution_time?: number
        rows_processed?: number
        cache_hits?: number
        cache_misses?: number
        policy_evaluation_time?: number
      }
      metrics?: {
        total_evaluations: number
        avg_evaluation_time: number
        cache_hit_rate: number
        error_rate: number
        slow_evaluations: number
      }
    }
    realtime?: {
      subscription?: string
      event?: string
      topic?: string
      filter?: string
      latency?: number
      maxLatency?: number
      throughput?: number
      maxThroughput?: number
      metrics?: {
        errors: number
        avgLatency: number
        avgThroughput: number
      }
    }
    function?: {
      name?: string
      version?: string
      region?: string
    }
    storage?: {
      bucket?: string
      object?: string
      operation?: string
    }
  }
}

/**
 * Options for creating a DatabaseError
 */
export interface DatabaseErrorOptions {
  code: ErrorCode
  message: string
  cause?: Error
  context?: ErrorContext
  retryable?: boolean
}

export class DatabaseError extends Error {
  public readonly code: ErrorCode
  public readonly context: ErrorContext
  public readonly retryable: boolean
  public readonly cause?: Error

  constructor(options: DatabaseErrorOptions) {
    const { code, message, cause, context = {}, retryable = false } = options
    
    super(message)
    this.name = 'DatabaseError'
    this.code = code
    this.context = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString()
    }
    this.cause = cause
    this.retryable = retryable
  }

  /**
   * Check if the error is retryable
   */
  isRetryable(): boolean {
    return this.retryable
  }

  /**
   * Check if the error is related to authentication
   */
  isAuthError(): boolean {
    return [
      ErrorCode.AUTH_ERROR,
      ErrorCode.AUTH_INVALID_TOKEN,
      ErrorCode.AUTH_EXPIRED_TOKEN
    ].includes(this.code)
  }

  /**
   * Check if the error is related to permissions
   */
  isPermissionError(): boolean {
    return [
      ErrorCode.PERMISSION_DENIED,
      ErrorCode.INSUFFICIENT_PRIVILEGES,
      ErrorCode.RLS_POLICY_VIOLATION
    ].includes(this.code)
  }

  /**
   * Check if the error is related to rate limiting
   */
  isRateLimitError(): boolean {
    return this.code === ErrorCode.RATE_LIMIT_EXCEEDED
  }

  /**
   * Check if the error is related to realtime features
   */
  isRealtimeError(): boolean {
    return [
      ErrorCode.REALTIME_ERROR,
      ErrorCode.REALTIME_SUBSCRIPTION_ERROR
    ].includes(this.code)
  }

  /**
   * Create a formatted error message including context
   */
  toString(): string {
    const { code, message, context } = this
    const contextStr = Object.entries(context)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
      .join(', ')
    
    return `[${code}] ${message}${contextStr ? ` (${contextStr})` : ''}`
  }
} 
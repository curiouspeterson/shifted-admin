/**
 * Database Error Types
 * Last Updated: 2024-01-15
 * 
 * Defines error types and codes for database operations.
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
  SERIALIZATION_FAILURE = 'SERIALIZATION_FAILURE'
}

export interface ErrorContext {
  // Generic context
  message?: string
  originalError?: unknown
  
  // Database context
  table?: string
  column?: string
  value?: unknown
  constraint?: string
  
  // Operation context
  operation?: 'create' | 'read' | 'update' | 'delete' | 'query'
  id?: string
  data?: unknown
  filters?: unknown
}

export class DatabaseError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly context: ErrorContext = {}
  ) {
    super(message)
    this.name = 'DatabaseError'
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
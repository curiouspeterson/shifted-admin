/**
 * Database Errors
 * Last Updated: 2024-03-19 19:25 PST
 */

/**
 * Error codes
 */
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE: 'DUPLICATE',
  FOREIGN_KEY: 'FOREIGN_KEY',
  SERIALIZATION_FAILURE: 'SERIALIZATION_FAILURE',
  DEADLOCK_DETECTED: 'DEADLOCK_DETECTED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  CONFLICT: 'CONFLICT',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Map database error codes to application error codes
 */
export function mapDatabaseError(error: any): DatabaseError {
  if (error instanceof DatabaseError) {
    return error;
  }

  // Handle Supabase error codes
  const code = error?.code;
  const message = error?.message || 'Unknown error';
  const details = error?.details || error;

  switch (code) {
    case 'PGRST116':
      return new DatabaseError(ErrorCodes.NOT_FOUND, message, details);
    case '23505':
      return new DatabaseError(ErrorCodes.DUPLICATE, message, details);
    case '23503':
      return new DatabaseError(ErrorCodes.FOREIGN_KEY, message, details);
    case '40001':
      return new DatabaseError(ErrorCodes.SERIALIZATION_FAILURE, message, details);
    case '40P01':
      return new DatabaseError(ErrorCodes.DEADLOCK_DETECTED, message, details);
    case 'CONFLICT':
      return new DatabaseError(ErrorCodes.CONFLICT, message, details);
    default:
      return new DatabaseError(ErrorCodes.UNKNOWN, message, details);
  }
} 
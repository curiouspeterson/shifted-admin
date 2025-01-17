/**
 * Database Error Types
 * Last Updated: 2025-01-17
 */

import { AppError } from './base';
import { 
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND 
} from '@/lib/constants/http';

export interface DatabaseErrorDetail extends Record<string, unknown> {
  code: string;
  table?: string;
  column?: string;
  constraint?: string;
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: DatabaseErrorDetail) {
    super({
      message,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      details
    });
  }
}

export class NotFoundError extends DatabaseError {
  constructor(resource: string, identifier?: string | number) {
    super(
      `${resource}${identifier ? ` with ID ${identifier}` : ''} not found`,
      {
        code: 'NOT_FOUND',
        status: HTTP_STATUS_NOT_FOUND,
        resource,
        ...(identifier && { identifier: String(identifier) })
      }
    );
  }
}

export class ConnectionError extends DatabaseError {
  constructor(details?: DatabaseErrorDetail) {
    super('Database connection failed', details);
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, details?: DatabaseErrorDetail) {
    super(message, {
      ...details,
      code: 'QUERY_ERROR'
    });
  }
}

export class ConstraintError extends DatabaseError {
  constructor(message: string, details?: DatabaseErrorDetail) {
    super(message, {
      ...details,
      code: 'CONSTRAINT_ERROR'
    });
  }
} 
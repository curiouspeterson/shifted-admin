/**
 * Base Error Classes
 * Last Updated: 2025-01-17
 */

import { 
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND 
} from '@/lib/constants/http';

export interface ErrorConfig {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown> | undefined;
}

export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown> | undefined;

  constructor(config: ErrorConfig) {
    super(config.message);
    this.name = this.constructor.name;
    this.status = config.status ?? HTTP_STATUS_INTERNAL_SERVER_ERROR;
    this.code = config.code ?? 'INTERNAL_SERVER_ERROR';
    this.details = config.details;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      code: this.code,
      ...(this.details && { details: this.details })
    };
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      details
    });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    super({
      message: `${resource}${identifier ? ` with ID ${identifier}` : ''} not found`,
      status: HTTP_STATUS_NOT_FOUND,
      code: 'NOT_FOUND',
      details: { resource, identifier }
    });
  }
} 
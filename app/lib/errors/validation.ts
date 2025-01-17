/**
 * Validation Error Types
 * Last Updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_BAD_REQUEST } from '@/lib/constants/http';

export interface ValidationErrorDetail {
  path: string[];
  message: string;
  code: string;
}

export class ValidationError extends AppError {
  constructor(message: string, details: ValidationErrorDetail[]) {
    super({
      message,
      status: HTTP_STATUS_BAD_REQUEST,
      code: 'VALIDATION_ERROR',
      details: { errors: details }
    });
  }
}

export class TimeRangeError extends ValidationError {
  constructor(message: string, start?: Date, end?: Date) {
    super(message, [{
      path: ['timeRange'],
      message,
      code: 'INVALID_TIME_RANGE',
      ...(start && { start: start.toISOString() }),
      ...(end && { end: end.toISOString() })
    }]);
  }
}

export class SchemaValidationError extends ValidationError {
  constructor(details: ValidationErrorDetail[]) {
    super('Schema validation failed', details);
  }
}

export class InputValidationError extends ValidationError {
  constructor(details: ValidationErrorDetail[]) {
    super('Input validation failed', details);
  }
} 
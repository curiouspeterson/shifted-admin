/**
 * Validation Error Types
 * Last updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_BAD_REQUEST } from '../api/constants';

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
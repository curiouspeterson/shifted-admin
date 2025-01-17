/**
 * Authentication Error Types
 * Last updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_UNAUTHORIZED } from '../api/constants';

export class AuthError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      status: HTTP_STATUS_UNAUTHORIZED,
      code: 'AUTH_ERROR',
      details
    });
  }
}

export class TokenExpiredError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super('Authentication token has expired', details);
  }
}

export class InvalidTokenError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super('Invalid authentication token', details);
  }
}

export class MissingTokenError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super('Missing authentication token', details);
  }
} 
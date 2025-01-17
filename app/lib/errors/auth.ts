/**
 * Authentication Error Types
 * Last Updated: 2025-01-17
 */

import { AppError } from './base';
import { 
  HTTP_STATUS_UNAUTHORIZED, 
  HTTP_STATUS_FORBIDDEN 
} from '@/lib/constants/http';

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
    super('Token has expired', details);
  }
}

export class InvalidTokenError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super('Invalid token provided', details);
  }
}

export class MissingTokenError extends AuthError {
  constructor(details?: Record<string, unknown>) {
    super('No token provided', details);
  }
}

export class AuthenticationError extends AuthError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super({
      message,
      status: HTTP_STATUS_FORBIDDEN,
      code: 'FORBIDDEN',
      details
    });
  }
} 
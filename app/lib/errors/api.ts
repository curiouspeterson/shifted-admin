/**
 * API Error Types
 * Last updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_TOO_MANY_REQUESTS } from '../api/constants';

export interface ApiErrorDetail extends Record<string, unknown> {
  path: string;
  method: string;
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

export class ApiError extends AppError {
  constructor(message: string, details: ApiErrorDetail) {
    super({
      message,
      status: HTTP_STATUS_BAD_REQUEST,
      code: 'API_ERROR',
      details
    });
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string, details: ApiErrorDetail) {
    super(message, {
      ...details,
      status: HTTP_STATUS_TOO_MANY_REQUESTS,
      code: 'RATE_LIMIT_ERROR'
    });
  }
}

export class InvalidRequestError extends ApiError {
  constructor(message: string, details: ApiErrorDetail) {
    super(message, {
      ...details,
      code: 'INVALID_REQUEST_ERROR'
    });
  }
}

export class EndpointNotFoundError extends ApiError {
  constructor(path: string, method: string) {
    super(`Endpoint not found: ${method} ${path}`, {
      path,
      method,
      code: 'ENDPOINT_NOT_FOUND_ERROR'
    });
  }
}
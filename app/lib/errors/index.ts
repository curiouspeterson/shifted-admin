/**
 * Error Types and Utilities
 * Last Updated: 2025-01-17
 */

// Base error types
export type { ErrorConfig } from './base';
export { AppError } from './base';

// Auth error types
export { 
  AuthError,
  TokenExpiredError,
  InvalidTokenError,
  MissingTokenError,
  AuthenticationError,
  AuthorizationError 
} from './auth';

// Database error types
export { DatabaseError, NotFoundError } from './database';

// Validation error types
export { ValidationError, TimeRangeError } from './validation';

// API error types
export { 
  ApiError,
  ApiErrorCode,
  createApiError,
  formatApiError 
} from './api';

// Monitoring error types
export { MonitoringError } from './monitoring';

// Analytics error types
export { AnalyticsError } from './analytics'; 
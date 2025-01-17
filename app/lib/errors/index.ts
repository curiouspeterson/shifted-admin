/**
 * Error Types Index
 * Last updated: 2025-01-17
 * 
 * This file exports all error types used in the application.
 */

// Export base error types
export type { ErrorConfig } from './base';
export { AppError } from './base';

// Export auth errors
export { AuthError, TokenExpiredError, InvalidTokenError, MissingTokenError } from './auth';

// Export database errors
export { DatabaseError } from './database';

// Export validation errors
export { ValidationError } from './validation';

// Export monitoring errors
export { MonitoringError } from './monitoring';

// Export analytics errors
export { AnalyticsError } from './analytics';

// Export API errors
export { ApiError } from './api'; 
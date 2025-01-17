/**
 * Error Handling Exports
 * Last Updated: 2024-03-21
 * 
 * This file exports all error-related functionality from the errors module.
 */

// Export error types and interfaces
export * from './types';

// Export base error class and others
export { BaseError as AppError, DatabaseError, ValidationError, AuthenticationError, AuthorizationError, NetworkError, BusinessError, TimeRangeError, NotFoundError } from './base';
export { ErrorSeverity, ErrorCategory } from './base';

// Export service worker error
export { ServiceWorkerError } from './service-worker';

// Export error utilities
export * from './utils';

// Export error boundary component
export { ErrorBoundary } from '@/components/error/error-boundary'; 
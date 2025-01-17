/**
 * Service Worker Error
 * Last Updated: 2025-01-17
 * 
 * Custom error class for service worker related errors.
 */

import { BaseError, ErrorSeverity, ErrorCategory } from './base';

export class ServiceWorkerError extends BaseError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, {
      code: 'SERVICE_WORKER_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.SYSTEM,
      source: 'service-worker',
      details
    });
  }
} 
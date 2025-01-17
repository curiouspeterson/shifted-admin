/**
 * Monitoring Error Types
 * Last updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '../api/constants';

export interface MonitoringErrorDetail extends Record<string, unknown> {
  service: string;
  operation: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export class MonitoringError extends AppError {
  constructor(message: string, details: MonitoringErrorDetail) {
    super({
      message,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      code: 'MONITORING_ERROR',
      details
    });
  }
}

export class MetricsError extends MonitoringError {
  constructor(message: string, details: MonitoringErrorDetail) {
    super(message, {
      ...details,
      code: 'METRICS_ERROR'
    });
  }
}

export class TracingError extends MonitoringError {
  constructor(message: string, details: MonitoringErrorDetail) {
    super(message, {
      ...details,
      code: 'TRACING_ERROR'
    });
  }
}

export class LoggingError extends MonitoringError {
  constructor(message: string, details: MonitoringErrorDetail) {
    super(message, {
      ...details,
      code: 'LOGGING_ERROR'
    });
  }
} 
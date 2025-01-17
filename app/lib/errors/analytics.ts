/**
 * Analytics Error Types
 * Last Updated: 2025-01-17
 */

import { AppError } from './base';
import { HTTP_STATUS_INTERNAL_SERVER_ERROR } from '@/lib/constants/http';

export interface AnalyticsErrorDetail extends Record<string, unknown> {
  eventType: string;
  eventData?: Record<string, unknown>;
  timestamp: string;
}

export class AnalyticsError extends AppError {
  constructor(message: string, details: AnalyticsErrorDetail) {
    super({
      message,
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      code: 'ANALYTICS_ERROR',
      details
    });
  }
}

export class EventTrackingError extends AnalyticsError {
  constructor(message: string, details: AnalyticsErrorDetail) {
    super(message, {
      ...details,
      code: 'EVENT_TRACKING_ERROR'
    });
  }
}

export class DataProcessingError extends AnalyticsError {
  constructor(message: string, details: AnalyticsErrorDetail) {
    super(message, {
      ...details,
      code: 'DATA_PROCESSING_ERROR'
    });
  }
}

export class ReportingError extends AnalyticsError {
  constructor(message: string, details: AnalyticsErrorDetail) {
    super(message, {
      ...details,
      code: 'REPORTING_ERROR'
    });
  }
} 
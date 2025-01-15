/**
 * Error Monitoring Service
 * Last Updated: 2024-03-19 20:35 PST
 * 
 * This service provides error monitoring and analytics functionality.
 */

import { AppError } from './base';
import { ErrorCategories, ErrorSeverity } from './types';

/**
 * Error metrics interface
 */
interface ErrorMetrics {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byCode: Record<string, number>;
  recentErrors: Array<{
    timestamp: string;
    error: AppError;
  }>;
}

/**
 * Error monitoring service
 */
export class ErrorMonitoringService {
  private static instance: ErrorMonitoringService;
  private metrics: ErrorMetrics = {
    total: 0,
    byCategory: Object.fromEntries(
      Object.values(ErrorCategories).map(category => [category, 0])
    ),
    bySeverity: Object.fromEntries(
      ['info', 'warning', 'error', 'critical'].map(severity => [severity, 0])
    ),
    byCode: {},
    recentErrors: [],
  };

  private constructor() {
    // Initialize metrics storage
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorMonitoringService {
    if (!ErrorMonitoringService.instance) {
      ErrorMonitoringService.instance = new ErrorMonitoringService();
    }
    return ErrorMonitoringService.instance;
  }

  /**
   * Track an error
   */
  trackError(error: AppError): void {
    // Update total count
    this.metrics.total++;

    // Update category count
    const category = error.metadata.source;
    this.metrics.byCategory[category] = (this.metrics.byCategory[category] || 0) + 1;

    // Update severity count
    const severity = error.metadata.severity;
    this.metrics.bySeverity[severity] = (this.metrics.bySeverity[severity] || 0) + 1;

    // Update code count
    this.metrics.byCode[error.code] = (this.metrics.byCode[error.code] || 0) + 1;

    // Add to recent errors
    this.metrics.recentErrors.unshift({
      timestamp: new Date().toISOString(),
      error,
    });

    // Keep only last 100 errors
    if (this.metrics.recentErrors.length > 100) {
      this.metrics.recentErrors.pop();
    }

    // Log metrics update
    console.info('Error metrics updated:', {
      total: this.metrics.total,
      category,
      severity,
      code: error.code,
    });
  }

  /**
   * Get error metrics
   */
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  /**
   * Get error rate for a specific category
   */
  getErrorRate(category: string, timeWindowMs: number = 3600000): number {
    const now = Date.now();
    const relevantErrors = this.metrics.recentErrors.filter(
      ({ timestamp }) => now - new Date(timestamp).getTime() <= timeWindowMs
    );

    const categoryErrors = relevantErrors.filter(
      ({ error }) => error.metadata.source === category
    );

    return categoryErrors.length / (timeWindowMs / 1000); // errors per second
  }

  /**
   * Check if error rate exceeds threshold
   */
  isErrorRateExceeded(
    category: string,
    threshold: number,
    timeWindowMs: number = 3600000
  ): boolean {
    const rate = this.getErrorRate(category, timeWindowMs);
    return rate > threshold;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      total: 0,
      byCategory: Object.fromEntries(
        Object.values(ErrorCategories).map(category => [category, 0])
      ),
      bySeverity: Object.fromEntries(
        ['info', 'warning', 'error', 'critical'].map(severity => [severity, 0])
      ),
      byCode: {},
      recentErrors: [],
    };
  }
}

/**
 * Get error monitoring instance
 */
export function getErrorMonitoring(): ErrorMonitoringService {
  return ErrorMonitoringService.getInstance();
}

/**
 * Track an error
 */
export function trackError(error: AppError): void {
  ErrorMonitoringService.getInstance().trackError(error);
}

/**
 * Get error metrics
 */
export function getErrorMetrics(): ErrorMetrics {
  return ErrorMonitoringService.getInstance().getMetrics();
}

/**
 * Check if error rate exceeds threshold
 */
export function isErrorRateExceeded(
  category: string,
  threshold: number,
  timeWindowMs?: number
): boolean {
  return ErrorMonitoringService.getInstance().isErrorRateExceeded(
    category,
    threshold,
    timeWindowMs
  );
} 
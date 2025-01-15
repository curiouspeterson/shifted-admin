/**
 * Error Reporting Service
 * Last Updated: 2024-03-19 20:30 PST
 * 
 * This service handles error reporting, monitoring, and analytics.
 */

import { AppError } from './base';
import { formatErrorForLogging, shouldReportError } from './utils';

/**
 * Error reporting configuration
 */
interface ErrorReportingConfig {
  environment: string;
  release?: string;
  maxRetries?: number;
  batchSize?: number;
  flushInterval?: number;
}

/**
 * Error reporting service
 */
export class ErrorReportingService {
  private static instance: ErrorReportingService;
  private readonly config: Required<ErrorReportingConfig>;
  private errorQueue: AppError[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;

  private constructor(config: ErrorReportingConfig) {
    this.config = {
      environment: config.environment,
      release: config.release || 'unknown',
      maxRetries: config.maxRetries || 3,
      batchSize: config.batchSize || 10,
      flushInterval: config.flushInterval || 5000,
    };
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: ErrorReportingConfig): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      if (!config) {
        throw new Error('ErrorReportingService must be initialized with config');
      }
      ErrorReportingService.instance = new ErrorReportingService(config);
    }
    return ErrorReportingService.instance;
  }

  /**
   * Report an error
   */
  async reportError(error: AppError): Promise<void> {
    if (!shouldReportError(error)) {
      return;
    }

    this.errorQueue.push(error);

    if (this.errorQueue.length >= this.config.batchSize) {
      await this.flush();
    } else if (!this.flushTimeout) {
      this.flushTimeout = setTimeout(() => this.flush(), this.config.flushInterval);
    }
  }

  /**
   * Flush error queue
   */
  private async flush(): Promise<void> {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    if (this.errorQueue.length === 0) {
      return;
    }

    const errors = this.errorQueue.splice(0, this.config.batchSize);
    const formattedErrors = errors.map(error => ({
      ...formatErrorForLogging(error),
      environment: this.config.environment,
      release: this.config.release,
    }));

    try {
      // TODO: Send errors to error reporting service (e.g., Sentry, LogRocket)
      console.error('Reported errors:', formattedErrors);
    } catch (error) {
      console.error('Failed to report errors:', error);
      // Re-queue errors for retry
      this.errorQueue.unshift(...errors);
    }
  }

  /**
   * Track error metrics
   */
  private trackMetrics(error: AppError): void {
    // TODO: Track error metrics (e.g., error rates, types, sources)
    const metrics = {
      errorType: error.name,
      errorCode: error.code,
      source: error.metadata.source,
      severity: error.metadata.severity,
      timestamp: new Date().toISOString(),
    };

    console.info('Error metrics:', metrics);
  }
}

/**
 * Initialize error reporting
 */
export function initErrorReporting(config: ErrorReportingConfig): void {
  ErrorReportingService.getInstance(config);
}

/**
 * Report an error
 */
export async function reportError(error: AppError): Promise<void> {
  await ErrorReportingService.getInstance().reportError(error);
}

/**
 * Global error event handler
 */
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    reportError(error as AppError).catch(console.error);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason: any) => {
    console.error('Unhandled Rejection:', reason);
    reportError(reason as AppError).catch(console.error);
  });

  // Handle client-side errors
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      console.error('Client Error:', { message, source, lineno, colno, error });
      reportError(error as AppError).catch(console.error);
    };

    window.onunhandledrejection = (event) => {
      console.error('Unhandled Promise Rejection:', event.reason);
      reportError(event.reason as AppError).catch(console.error);
    };
  }
} 
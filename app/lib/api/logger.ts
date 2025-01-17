/**
 * API Logger
 * Last Updated: 2025-01-17
 * 
 * API logging functionality using the centralized error logger
 */

import { errorLogger } from '@/lib/logging/error-logger';

interface ApiContext {
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}

class ApiLogger {
  private static instance: ApiLogger;

  private constructor() {}

  static getInstance(): ApiLogger {
    if (!ApiLogger.instance) {
      ApiLogger.instance = new ApiLogger();
    }
    return ApiLogger.instance;
  }

  debug(message: string, context?: ApiContext): Promise<void> {
    return errorLogger.debug(message, this.enrichContext(context));
  }

  info(message: string, context?: ApiContext): Promise<void> {
    return errorLogger.info(message, this.enrichContext(context));
  }

  warn(message: string, context?: ApiContext): Promise<void> {
    return errorLogger.warn(message, this.enrichContext(context));
  }

  error(message: string, context?: ApiContext): Promise<void> {
    return errorLogger.error(message, this.enrichContext(context));
  }

  private enrichContext(context?: ApiContext): ApiContext {
    return {
      ...context,
      source: 'api',
      timestamp: new Date().toISOString(),
    };
  }
}

export const apiLogger = ApiLogger.getInstance(); 
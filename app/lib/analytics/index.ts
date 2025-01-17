/**
 * Analytics System
 * Last Updated: 2024-03-19
 * 
 * Implements user behavior tracking and analytics.
 */

import { EventTrackingError } from '../errors/analytics';
import { errorLogger } from '../logging/error-logger';

export type EventType = 
  | 'page_view'
  | 'button_click'
  | 'form_submit'
  | 'form_error'
  | 'api_request'
  | 'api_error'
  | 'navigation'
  | 'search'
  | 'filter'
  | 'sort'
  | 'download'
  | 'upload'
  | 'auth'
  | 'custom';

export interface EventProperties {
  [key: string]: unknown;
}

export interface AnalyticsEvent {
  type: EventType;
  name: string;
  properties: EventProperties | null;
  timestamp: string;
  sessionId: string;
  userId: string | null;
  path: string;
  referrer: string | null;
}

export interface AnalyticsErrorDetail {
  eventType: EventType;
  eventData: EventProperties | null;
  timestamp: string;
}

export interface AnalyticsConfig {
  endpoint: string;
  batchSize: number;
  flushInterval: number;
  sampleRate: number;
  debug: boolean;
}

const DEFAULT_CONFIG: AnalyticsConfig = {
  endpoint: '/api/analytics',
  batchSize: 10,
  flushInterval: 30000,
  sampleRate: 1.0,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Analytics service for tracking user behavior
 */
export class Analytics {
  private static instance: Analytics;
  private eventBuffer: AnalyticsEvent[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private sessionId: string;

  private constructor(private config: AnalyticsConfig) {
    this.sessionId = this.generateSessionId();
    this.initializeFlushInterval();
  }

  static getInstance(config: Partial<AnalyticsConfig> = {}): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics({
        ...DEFAULT_CONFIG,
        ...config,
      });
    }
    return Analytics.instance;
  }

  /**
   * Track a user event
   */
  async track(
    type: EventType,
    name: string,
    properties?: EventProperties | null
  ): Promise<void> {
    try {
      // Apply sampling if configured
      if (Math.random() > this.config.sampleRate) {
        return;
      }

      const event: AnalyticsEvent = {
        type,
        name,
        properties: properties ?? null,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: null,
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        referrer: typeof document !== 'undefined' ? document.referrer : null,
      };

      // Add user ID if available
      const userId = await this.getUserId();
      if (typeof userId === 'string' && userId.trim().length > 0) {
        event.userId = userId;
      }

      this.eventBuffer.push(event);

      if (this.config.debug) {
        console.debug('Analytics event:', event);
      }

      // Flush if buffer is full
      if (this.eventBuffer.length > 0 && this.eventBuffer.length >= this.config.batchSize) {
        await this.flush();
      }
    } catch (error) {
      const errorDetail: AnalyticsErrorDetail = {
        eventType: type,
        eventData: properties ?? null,
        timestamp: new Date().toISOString(),
      };
      throw new EventTrackingError('Failed to track event', errorDetail);
    }
  }

  /**
   * Initialize automatic flush interval
   */
  private initializeFlushInterval(): void {
    if (this.config.flushInterval > 0) {
      this.flushTimeout = setInterval(() => {
        void this.flush();
      }, this.config.flushInterval);

      // Clean up on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          if (this.flushTimeout) {
            clearInterval(this.flushTimeout);
          }
          void this.flush();
        });
      }
    }
  }

  /**
   * Flush events to the server
   */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    try {
      const events = [...this.eventBuffer];
      this.eventBuffer = [];

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send events: ${response.statusText}`);
      }
    } catch (error) {
      errorLogger.error('Failed to flush analytics events', {
        error,
        eventCount: this.eventBuffer.length,
      });
      // Restore events to buffer
      this.eventBuffer = [...this.eventBuffer];
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get the current user ID if available
   */
  private async getUserId(): Promise<string | null> {
    try {
      // Implementation will depend on your auth system
      // This is a placeholder
      return null;
    } catch {
      return null;
    }
  }
}

// Convenience functions
export const analytics = Analytics.getInstance();

export const trackEvent = (
  type: EventType,
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track(type, name, properties ?? null);
};

export const trackPageView = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('page_view', name, properties ?? null);
};

export const trackClick = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('button_click', name, properties ?? null);
};

export const trackFormSubmit = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('form_submit', name, properties ?? null);
};

export const trackFormError = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('form_error', name, properties ?? null);
};

export const trackApiRequest = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('api_request', name, properties ?? null);
};

export const trackApiError = (
  name: string,
  properties?: EventProperties
): Promise<void> => {
  return analytics.track('api_error', name, properties ?? null);
}; 
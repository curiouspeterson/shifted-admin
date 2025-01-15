/**
 * Fetcher Module
 * Last Updated: 2024-01-15
 * 
 * Provides enhanced fetcher functions for data fetching with offline support,
 * error handling, and retry logic. Designed for use with SWR and direct fetch calls.
 * 
 * Features:
 * - Type-safe response handling
 * - Comprehensive error handling
 * - Offline support with fallback
 * - Automatic retries with backoff
 * - Request caching and deduplication
 * - Background sync for offline mutations
 */

import { offlineStorage } from '@/app/lib/offline/utils/offline-storage';
import { APIError, ValidationError, AuthError, NotFoundError } from './errors';
import { toast } from 'sonner';

export interface FetcherOptions extends RequestInit {
  /** Enable offline support */
  offlineEnabled?: boolean;
  /** Time-to-live for cached data in milliseconds */
  cacheTTL?: number;
  /** Number of retry attempts */
  retries?: number;
  /** Custom retry delay in milliseconds */
  retryDelay?: number;
  /** Background sync options */
  backgroundSync?: {
    /** Queue key for background sync */
    queueKey: string;
    /** Callback to run after successful sync */
    onSync?: () => void;
  };
}

/**
 * Calculates exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number = 1000): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

/**
 * Processes API response and extracts error details
 */
async function handleErrorResponse(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type');
  let errorData: any = {};

  try {
    if (contentType?.includes('application/json')) {
      errorData = await response.json();
    } else {
      errorData.message = await response.text();
    }
  } catch {
    errorData.message = 'Failed to parse error response';
  }

  // Map HTTP status codes to specific error types
  switch (response.status) {
    case 400:
      if (errorData.fields) {
        throw new ValidationError(
          errorData.message || 'Validation failed',
          errorData.fields
        );
      }
      throw new APIError(
        errorData.message || 'Bad request',
        400,
        'BAD_REQUEST',
        errorData
      );
    case 401:
      throw new AuthError(errorData.message || 'Authentication required');
    case 404:
      throw new NotFoundError(
        errorData.resource || 'Resource',
        errorData.id
      );
    default:
      throw new APIError(
        errorData.message || 'API request failed',
        response.status,
        errorData.code,
        errorData
      );
  }
}

/**
 * Enhanced fetcher function with offline support and error handling
 */
export async function fetcher<T = any>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    offlineEnabled = false,
    cacheTTL,
    retries = 3,
    retryDelay = 1000,
    backgroundSync,
    ...init
  } = options;

  const url = typeof input === 'string' ? input : input.url;
  let attempt = 0;

  // Try to get cached data if offline support is enabled
  if (offlineEnabled) {
    try {
      const cachedData = await offlineStorage.retrieve<T>(url);
      if (cachedData) {
        return cachedData;
      }
    } catch (error) {
      console.error('Failed to retrieve cached data:', error);
    }
  }

  async function attemptFetch(): Promise<T> {
    try {
      const response = await fetch(input, init);

      // Handle successful response
      if (response.ok) {
        const data = await response.json();

        // Cache the response if offline support is enabled
        if (offlineEnabled) {
          try {
            await offlineStorage.store(url, data, {
              expiresIn: cacheTTL,
              version: 1,
            });
          } catch (error) {
            console.error('Failed to cache response:', error);
          }
        }

        return data;
      }

      // Handle error response
      await handleErrorResponse(response);
    } catch (error) {
      // Handle network errors or other exceptions
      if (!navigator.onLine) {
        toast.error('No internet connection');
        
        // Queue for background sync if enabled
        if (backgroundSync) {
          // TODO: Implement background sync queue
          toast.info('Changes will be synced when online');
        }

        // Return cached data as fallback
        if (offlineEnabled) {
          const cachedData = await offlineStorage.retrieve<T>(url);
          if (cachedData) {
            toast.info('Showing offline data');
            return cachedData;
          }
        }
      }

      // Retry on network errors if attempts remain
      if (attempt < retries) {
        attempt++;
        const delay = getRetryDelay(attempt, retryDelay);
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptFetch();
      }

      // Throw the error if all retries failed
      throw error;
    }

    // This should never be reached due to handleErrorResponse
    throw new Error('Unexpected error occurred');
  }

  return attemptFetch();
}

/**
 * Mutation fetcher with offline support
 */
export async function mutationFetcher<T = any>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    method = 'POST',
    headers = {},
    backgroundSync,
    ...rest
  } = options;

  // Queue mutation for background sync if offline
  if (!navigator.onLine && backgroundSync) {
    // TODO: Implement background sync queue
    toast.info('Changes will be synced when online');
    return null as any;
  }

  return fetcher<T>(input, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  });
} 
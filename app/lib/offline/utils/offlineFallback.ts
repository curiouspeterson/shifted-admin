import { toast } from '@/components/ui/toast';
import { OfflineStorage } from './offline';
import { IndexedDB } from './indexed-db';

interface FallbackConfig {
  key: string;
  ttl?: number;
  forceNetwork?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

interface FallbackResult<T> {
  data: T | null;
  source: 'network' | 'cache' | null;
  timestamp: number | null;
  error?: Error;
}

/**
 * Utility class for handling offline fallbacks
 */
export class OfflineFallback {
  private static instance: OfflineFallback;
  private db: IndexedDB;

  private constructor() {
    this.db = IndexedDB.getInstance({
      name: 'offline-fallbacks',
      version: 1,
      stores: {
        fallbacks: {
          keyPath: 'key',
          indexes: [
            { name: 'timestamp', keyPath: 'timestamp' },
          ],
        },
      },
    });

    // Initialize database connection
    this.db.init().catch(error => {
      console.error('Failed to initialize offline fallbacks database:', error);
    });
  }

  static getInstance(): OfflineFallback {
    if (!OfflineFallback.instance) {
      OfflineFallback.instance = new OfflineFallback();
    }
    return OfflineFallback.instance;
  }

  /**
   * Fetch data with offline fallback
   */
  async fetch<T>(
    fetcher: () => Promise<T>,
    config: FallbackConfig
  ): Promise<FallbackResult<T>> {
    const { key, ttl, forceNetwork = false, retryAttempts = 3, retryDelay = 1000 } = config;

    // If online and force network, try network first
    if (navigator.onLine && forceNetwork) {
      try {
        const data = await this.fetchWithRetry(fetcher, retryAttempts, retryDelay);
        await this.saveFallback(key, data, ttl);
        return {
          data,
          source: 'network',
          timestamp: Date.now(),
        };
      } catch (error) {
        console.error('Failed to fetch data:', error);
        // Fall through to try cache
      }
    }

    // Try to get from cache first
    try {
      const cached = await this.getFallback<T>(key);
      if (cached) {
        // If we have cached data and we're offline or not forcing network, use it
        if (!navigator.onLine || !forceNetwork) {
          return {
            data: cached.data,
            source: 'cache',
            timestamp: cached.timestamp,
          };
        }

        // If online, try to fetch fresh data
        try {
          const data = await this.fetchWithRetry(fetcher, retryAttempts, retryDelay);
          await this.saveFallback(key, data, ttl);
          return {
            data,
            source: 'network',
            timestamp: Date.now(),
          };
        } catch (error) {
          console.error('Failed to fetch fresh data:', error);
          toast({
            title: 'Using Cached Data',
            description: 'Could not fetch latest data. Using cached version.',
            variant: 'destructive',
          });
          return {
            data: cached.data,
            source: 'cache',
            timestamp: cached.timestamp,
          };
        }
      }
    } catch (error) {
      console.error('Failed to get cached data:', error);
    }

    // If we're offline and have no cache, return error
    if (!navigator.onLine) {
      const error = new Error('No internet connection and no cached data available');
      return {
        data: null,
        source: null,
        timestamp: null,
        error,
      };
    }

    // Last resort: try network
    try {
      const data = await this.fetchWithRetry(fetcher, retryAttempts, retryDelay);
      await this.saveFallback(key, data, ttl);
      return {
        data,
        source: 'network',
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to fetch data:', error);
      return {
        data: null,
        source: null,
        timestamp: null,
        error: error as Error,
      };
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry<T>(
    fetcher: () => Promise<T>,
    attempts: number,
    delay: number
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fetcher();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    throw new Error('Failed to fetch after all retry attempts');
  }

  /**
   * Save fallback data
   */
  private async saveFallback<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      await this.db.execute({
        store: 'fallbacks',
        type: 'put',
        data: {
          key,
          data,
          timestamp: Date.now(),
          expiresAt: ttl ? Date.now() + ttl : undefined,
        },
      });
    } catch (error) {
      console.error('Failed to save fallback:', error);
      throw error;
    }
  }

  /**
   * Get fallback data
   */
  private async getFallback<T>(key: string): Promise<{
    data: T;
    timestamp: number;
  } | null> {
    try {
      const result = await this.db.execute<{
        data: T;
        timestamp: number;
        expiresAt?: number;
      }>({
        store: 'fallbacks',
        type: 'get',
        key,
      });

      if (!result) return null;

      // Check if data has expired
      if (result.expiresAt && Date.now() > result.expiresAt) {
        await this.db.execute({
          store: 'fallbacks',
          type: 'delete',
          key,
        });
        return null;
      }

      return {
        data: result.data,
        timestamp: result.timestamp,
      };
    } catch (error) {
      console.error('Failed to get fallback:', error);
      return null;
    }
  }

  /**
   * Clear expired fallbacks
   */
  async clearExpired(): Promise<void> {
    try {
      const fallbacks = await this.db.execute<Array<{
        key: string;
        expiresAt?: number;
      }>>({
        store: 'fallbacks',
        type: 'getAll',
      });

      if (!fallbacks) return;

      const now = Date.now();
      for (const fallback of fallbacks) {
        if (fallback.expiresAt && now > fallback.expiresAt) {
          await this.db.execute({
            store: 'fallbacks',
            type: 'delete',
            key: fallback.key,
          });
        }
      }
    } catch (error) {
      console.error('Failed to clear expired fallbacks:', error);
    }
  }

  /**
   * Clear all fallbacks
   */
  async clearAll(): Promise<void> {
    try {
      await this.db.execute({
        store: 'fallbacks',
        type: 'clear',
      });
    } catch (error) {
      console.error('Failed to clear fallbacks:', error);
      throw error;
    }
  }
} 
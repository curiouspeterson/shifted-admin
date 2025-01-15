import { toast } from '@/components/ui/toast';

interface CacheConfig {
  maxAge?: number; // Maximum age of cached data in milliseconds
  staleWhileRevalidate?: boolean; // Whether to return stale data while fetching fresh data
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class CacheManager {
  private static instance: CacheManager;
  private cache: Map<string, CacheEntry<any>>;
  private defaultConfig: CacheConfig = {
    maxAge: 5 * 60 * 1000, // 5 minutes
    staleWhileRevalidate: true,
  };

  private constructor() {
    this.cache = new Map();
  }

  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: CacheConfig = {}
  ): Promise<T> {
    const { maxAge = this.defaultConfig.maxAge, staleWhileRevalidate = this.defaultConfig.staleWhileRevalidate } = config;
    const cached = this.cache.get(key);

    // If we have cached data and it's not expired, return it
    if (cached && Date.now() - cached.timestamp < maxAge!) {
      return cached.data;
    }

    // If we have stale data and staleWhileRevalidate is enabled, return stale data and fetch in background
    if (cached && staleWhileRevalidate) {
      this.fetchAndCache(key, fetcher).catch(error => {
        console.error('Background fetch failed:', error);
        toast({
          title: 'Sync Error',
          description: 'Failed to update cached data. Some information may be outdated.',
          variant: 'destructive',
        });
      });
      return cached.data;
    }

    // Otherwise, fetch fresh data
    return this.fetchAndCache(key, fetcher);
  }

  private async fetchAndCache<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      const data = await fetcher();
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });
      return data;
    } catch (error) {
      // If we have stale data, return it on error
      const cached = this.cache.get(key);
      if (cached) {
        toast({
          title: 'Network Error',
          description: 'Using cached data. Some information may be outdated.',
          variant: 'destructive',
        });
        return cached.data;
      }
      throw error;
    }
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let totalEntries = 0;
    let expiredEntries = 0;
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      totalEntries++;
      if (now - entry.timestamp > this.defaultConfig.maxAge!) {
        expiredEntries++;
      }
      totalSize += JSON.stringify(entry).length;
    }

    return {
      totalEntries,
      expiredEntries,
      totalSize: Math.round(totalSize / 1024), // Size in KB
      hitRate: 0, // To be implemented with hit tracking
    };
  }
} 
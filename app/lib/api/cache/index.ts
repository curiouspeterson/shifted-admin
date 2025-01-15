/**
 * Cache Module
 * Last Updated: 2025-01-15
 * 
 * This module provides caching functionality for API responses.
 */

import { Redis } from '@upstash/redis';
import { CacheService } from './service';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create and export cache service instance
export const cacheService = new CacheService(redis);

// Export types
export type { CacheConfig } from './config';
export type { CacheHeaders } from './service'; 
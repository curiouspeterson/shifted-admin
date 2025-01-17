/**
 * Rate Limiter Factory
 * Last Updated: 2025-01-17
 * 
 * Factory function to create rate limiters with configuration.
 */

import { RateLimiter, RateLimitOptions } from './rate-limiter';
import { rateLimitConfigs } from './rate-limit';

/**
 * Creates a rate limiter instance with the specified configuration
 */
export function createRateLimiter(identifier: keyof typeof rateLimitConfigs | RateLimitOptions): RateLimiter {
  // If identifier is a string, use predefined config
  if (typeof identifier === 'string') {
    const config = rateLimitConfigs[identifier];
    if (!config) {
      throw new Error(`Rate limit configuration not found for identifier: ${identifier}`);
    }
    return new RateLimiter(config);
  }
  
  // Otherwise use provided options
  return new RateLimiter(identifier);
} 
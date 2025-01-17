/**
 * API Module Exports
 * Last Updated: 2025-01-17
 * 
 * This file exports all API-related functionality.
 */

// Export route handler
export { createRouteHandler } from './route-handler';
export type { RouteHandler } from './route-handler';

// Export rate limiting
export { createRateLimiter } from './create-rate-limiter';
export { RateLimiter } from './rate-limiter';
export type { RateLimitOptions, RateLimitState } from './rate-limiter';
export { rateLimitConfigs, defaultRateLimits } from './rate-limit';

// Export error handling
export { handleApiError } from './errors';
export type { ApiError } from './errors';

// Export types
export * from './types'; 
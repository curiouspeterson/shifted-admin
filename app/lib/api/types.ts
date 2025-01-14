/**
 * API Types Module
 * Last Updated: 2024
 * 
 * This file defines common types used across the API layer.
 * It includes:
 * - API response types
 * - Route context types
 * - Common utility types
 */

import { createServer } from '../supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * API Response Type
 * Defines the structure of all API responses
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
  metadata?: {
    path?: string;
    timestamp?: string;
    count?: number;
    message?: string;
    originalError?: unknown;
    validation?: unknown[];
    [key: string]: unknown;
  };
}

/**
 * Route Context Type
 * Defines the context object passed to route handlers
 */
export interface RouteContext {
  supabase: ReturnType<typeof createServer>;
  session: Session | null;
  params?: { [key: string]: string };
}

/**
 * API Error Response Type
 * Used when returning error responses
 */
export interface ApiErrorResponse {
  error: string;
  data: null;
  metadata?: {
    path?: string;
    timestamp?: string;
    validation?: unknown[];
    originalError?: unknown;
    [key: string]: unknown;
  };
}

/**
 * API Success Response Type
 * Used when returning successful responses
 */
export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
  metadata?: {
    path?: string;
    timestamp?: string;
    count?: number;
    message?: string;
    [key: string]: unknown;
  };
}

/**
 * Response Creation Utilities
 */
export function createSuccessResponse<T>(
  data: T,
  metadata?: ApiSuccessResponse<T>['metadata']
): ApiSuccessResponse<T> {
  return {
    data,
    error: null,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
}

export function createErrorResponse(
  error: string,
  metadata?: ApiErrorResponse['metadata']
): ApiErrorResponse {
  return {
    error,
    data: null,
    metadata: {
      timestamp: new Date().toISOString(),
      ...metadata,
    },
  };
} 
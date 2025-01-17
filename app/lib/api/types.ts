/**
 * API Types
 * Last Updated: 2025-01-17
 * 
 * Type definitions for API handlers and responses.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { CacheControl } from './cache';
import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import type { RateLimiterOpts } from './rate-limit';

/**
 * Extended NextRequest with Supabase client and session
 */
export interface ExtendedNextRequest extends NextRequest {
  supabase: SupabaseClient<Database>;
  user?: User;
  session?: Session;
}

/**
 * Base query parameters
 */
export interface BaseQueryParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

/**
 * Cache information
 */
export interface CacheInfo {
  hit: boolean;
  ttl: number;
}

/**
 * Rate limit information
 */
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * API response metadata
 */
export interface ResponseMetadata {
  requestId: string;
  processingTime: number;
  version: string;
  timestamp: string;
  cache: CacheInfo | null;
  rateLimit: RateLimit;
}

/**
 * API response structure
 */
export interface ApiResponse<T = unknown> {
  data: T;
  error: null;
  metadata: ResponseMetadata;
}

/**
 * Route context with typed request body and query parameters
 */
export interface RouteContext<
  TBody extends z.ZodSchema = z.ZodObject<any>,
  TQuery extends BaseQueryParams = BaseQueryParams
> {
  req: NextRequest;
  params?: Record<string, string>;
  body?: z.infer<TBody>;
  query: TQuery;
}

/**
 * Database query options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending: boolean;
  };
  filter?: Partial<Record<string | number | symbol, string | number | boolean | undefined>>;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Cache configuration options
 */
export interface CacheConfig {
  control: CacheControl;
  revalidate?: number;
  tags?: string[];
  prefix?: string;
  includeQuery?: boolean;
  excludeParams?: readonly string[];
}

/**
 * API handler options
 */
export interface ApiHandlerOptions<T = unknown> {
  cache?: CacheConfig;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
    identifier?: string;
  };
  validate?: {
    body?: z.ZodSchema<T>;
    query?: z.ZodSchema;
    params?: z.ZodSchema;
  };
}

export interface RouteHandlerConfig<T extends z.ZodType> {
  schema?: T;
  handler: (
    req: NextRequest,
    data?: z.infer<T>
  ) => Promise<unknown>;
  rateLimit?: RateLimiterOpts;
}

export interface ApiContext<T> {
  req: NextRequest;
  params?: Record<string, string>;
  headers: Headers;
  body?: T;
  query: URLSearchParams;
} 
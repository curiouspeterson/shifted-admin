/**
 * API Types
 * Last Updated: 2025-01-16
 * 
 * This module defines common types used across API endpoints.
 * Provides type-safe interfaces for API responses and route contexts.
 */

import { SupabaseClient, User, Session } from '@supabase/supabase-js';
import type { Database } from '../database/database.types';
import { z } from 'zod';

/**
 * Cache information for API responses
 */
export interface CacheInfo {
  /** Whether the response was served from cache */
  hit: boolean;
  /** Time-to-live in seconds */
  ttl: number;
}

/**
 * Rate limit information for API responses
 */
export interface RateLimit {
  /** Maximum number of requests allowed */
  limit: number;
  /** Number of requests remaining */
  remaining: number;
  /** Timestamp when the rate limit resets */
  reset: number;
}

/**
 * Metadata for API responses
 * Contains additional information about the response
 */
export interface ResponseMetadata {
  /** ISO timestamp of when the response was generated */
  timestamp: string;
  /** Unique identifier for the request */
  requestId: string;
  /** Time taken to process the request in milliseconds */
  processingTime: number;
  /** API version */
  version: string;
  /** Cache status - null when caching is disabled */
  cache: CacheInfo | null;
  /** Rate limit status - null when rate limiting is disabled */
  rateLimit: RateLimit | null;
}

/**
 * Supported filter operators
 */
export type FilterOperator = 
  | 'eq'   // equals
  | 'neq'  // not equals
  | 'gt'   // greater than
  | 'gte'  // greater than or equal
  | 'lt'   // less than
  | 'lte'  // less than or equal
  | 'like' // pattern matching
  | 'in'   // value in array
  | 'nin'; // value not in array

/**
 * Valid filter values
 */
export type FilterValue = 
  | string 
  | number 
  | boolean 
  | null 
  | Array<string | number | boolean | null>;

/**
 * Filter condition for query parameters
 */
export interface FilterCondition {
  /** The operator to apply */
  operator: FilterOperator;
  /** The value to compare against */
  value: FilterValue;
}

/**
 * Base query parameters for API routes
 */
export interface BaseQueryParams {
  /** Number of items to return */
  limit?: number;
  /** Number of items to skip */
  offset?: number;
  /** Column to sort by */
  sort?: string;
  /** Sort direction */
  order?: 'asc' | 'desc';
  /** Filter conditions */
  filter?: Record<string, FilterCondition>;
}

/**
 * Type-safe API response format
 * @template T - The type of data returned in the response
 */
export interface ApiResponse<T = never> {
  /** The response data, null if there was an error */
  data: T | null;
  /** Error message if there was an error, null otherwise */
  error: string | null;
  /** Metadata about the response */
  metadata: ResponseMetadata;
}

/**
 * Context passed to route handlers
 * @template TBody - The type of the request body, must be a Zod object schema
 * @template TQuery - The type of query parameters, extends BaseQueryParams
 */
export interface RouteContext<
  TBody extends z.ZodObject<any> = z.ZodObject<any>,
  TQuery extends BaseQueryParams = BaseQueryParams
> {
  /** Supabase client instance */
  supabase: SupabaseClient<Database>;
  /** Current user session */
  session: Session | null;
  /** Current user */
  user: User | null;
  /** Parsed and validated request body */
  body: z.infer<TBody>;
  /** Parsed query parameters */
  query: TQuery;
  /** Unique request identifier */
  requestId: string;
  /** Rate limit information */
  rateLimit: RateLimit;
  /** Cache information */
  cache: CacheInfo;
} 
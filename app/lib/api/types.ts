/**
 * API Types and Interfaces
 * Last Updated: 2025-01-17
 */

import { z } from 'zod';
import { CacheControl } from './cache';
import { SupabaseClient } from '@supabase/supabase-js';
import type { User, Session } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import type { RateLimiterOpts } from './rate-limit';
import { NextRequest } from 'next/server';

export interface ExtendedNextRequest extends NextRequest {
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
}

export interface BaseQueryParams {
  [key: string]: string | string[] | undefined;
  limit?: string;
  offset?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CacheInfo {
  control: CacheControl;
  revalidate?: number;
}

export interface RateLimit {
  points: number;
  duration: number;
  blockDuration?: number;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  duration: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: ResponseMetadata;
}

export interface RouteContext {
  req: ExtendedNextRequest;
  supabase: SupabaseClient<Database>;
  user: User | null;
  session: Session | null;
}

export interface QueryOptions {
  limit?: number | undefined;
  offset?: number | undefined;
  orderBy?: {
    column: keyof Database['public']['Tables'];
    ascending?: boolean | undefined;
  } | undefined;
  filter?: Record<string, unknown> | undefined;
}

export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CacheConfig {
  control: CacheControl;
  revalidate?: number;
}

export interface ApiHandlerOptions<T = unknown> {
  schema?: z.ZodType<T>;
  rateLimit?: RateLimiterOpts;
  cache?: CacheConfig;
}

export type ApiHandler<T = unknown> = (context: RouteContext) => Promise<ApiResponse<T>>;

export type RouteHandlerConfig<T = unknown> = {
  schema?: z.ZodType<T>;
  handler: ApiHandler<T>;
  rateLimit?: RateLimiterOpts;
  cache?: CacheConfig;
}; 
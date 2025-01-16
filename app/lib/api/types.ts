/**
 * API Types
 * Last Updated: 2024-01-15
 * 
 * This module provides common types used across the API layer.
 */

import { DatabaseError } from '@/lib/errors/base';

export interface ApiErrorDetails {
  field?: string;
  code: string;
  message: string;
  params?: Record<string, string | number | boolean>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetails[];
}

export interface ApiMetadata {
  cached?: boolean;
  cacheHit?: boolean;
  cacheTtl?: number;
  timestamp: string;
  requestId: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  metadata?: ApiMetadata;
} 
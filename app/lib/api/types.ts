/**
 * API Types
 * Last Updated: 2025-01-15
 * 
 * This module provides common types used across the API layer.
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    cached?: boolean;
    cacheHit?: boolean;
    cacheTtl?: number;
    timestamp: string;
    requestId: string;
  };
} 
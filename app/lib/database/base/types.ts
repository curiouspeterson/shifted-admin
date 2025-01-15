/**
 * Database Types
 * Last Updated: 2024-03-19 22:15 PST
 * 
 * This file defines the base types for database operations.
 */

/**
 * Base database record interface
 */
export interface DatabaseRecord {
  id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Database operation result
 */
export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Query filters interface
 */
export interface QueryFilters {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  [key: string]: any;
} 
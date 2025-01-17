/**
 * Supabase Utilities
 * Last Updated: 2025-01-16
 * 
 * Utility functions for working with Supabase client and data.
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient, Session, PostgrestError } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'
import { Json, isJson, parseJson } from '@/lib/types/json'
import { ValidationErrorCode } from '@/lib/errors/validation'
import { createCustomValidationError } from '@/lib/errors/validation'
import { ErrorContext, BaseError, ErrorSeverity, ErrorCategory } from '@/lib/errors/base'
import { Try } from '@/lib/errors/try'

type TypedSupabaseClient = SupabaseClient<Database>

/**
 * Error class for Supabase-related errors
 */
export class SupabaseError extends BaseError {
  constructor(
    message: string,
    code: string,
    public originalError?: unknown
  ) {
    super(message, {
      code,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.DATABASE,
      details: {
        originalError: originalError ? String(originalError) : undefined
      }
    });
  }
}

/**
 * Creates an authenticated Supabase client with error handling
 */
export function createServerClient(): Try<TypedSupabaseClient> {
  return Try.from(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new SupabaseError(
        'Missing Supabase environment variables',
        'CONFIG_ERROR'
      );
    }

    const cookieStore = cookies();
    return createClient<Database>(
      supabaseUrl,
      supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storage: {
            getItem: (key: string) => {
              const value = cookieStore.get(key)?.value;
              return value ?? null;
            },
            setItem: (key: string, value: string) => {
              cookieStore.set(key, value);
            },
            removeItem: (key: string) => {
              cookieStore.delete(key);
            }
          }
        }
      }
    );
  });
}

// Create public Supabase client
export const supabase: TypedSupabaseClient = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new SupabaseError(
      'Missing Supabase environment variables',
      'CONFIG_ERROR'
    );
  }

  return createClient<Database>(supabaseUrl, supabaseKey);
})();

/**
 * Safely executes a database query with error handling
 * Returns a Try monad containing either the result or an error
 */
export async function executeQuery<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>
): Promise<Try<T>> {
  return Try.fromAsync(async () => {
    const { data, error } = await operation();

    if (error) {
      throw new SupabaseError(
        'Database operation failed',
        'DB_ERROR',
        error
      );
    }

    if (data === null) {
      throw new SupabaseError(
        'No data returned',
        'NOT_FOUND'
      );
    }

    return data;
  });
}

/**
 * Get user profile data
 * Returns a Try monad containing either the user profile or an error
 */
export async function getUserProfile(userId: string): Promise<Try<Database['public']['Tables']['employees']['Row']>> {
  return executeQuery(async () => 
    await supabase
      .from('employees')
      .select('*')
      .eq('user_id', userId)
      .single()
  );
}

/**
 * Transforms a Supabase timestamp to a Date object
 */
export function parseSupabaseTimestamp(timestamp: string | null): Date | null {
  if (!timestamp) return null
  return new Date(timestamp)
}

/**
 * Formats a date for Supabase timestamp fields
 */
export function formatSupabaseTimestamp(date: Date): string {
  return date.toISOString()
}

/**
 * Safely parses and validates metadata fields with enhanced error tracking
 * @throws ValidationError if metadata is invalid
 */
export function parseMetadata<T extends Json>(
  metadata: unknown,
  context?: ErrorContext
): Try<T> {
  if (!metadata) return Try.success(null as T);

  return Try.from(() => {
    // If string, parse it first
    const parsed = typeof metadata === 'string' ? parseJson(metadata) : metadata;
    
    // Validate the parsed data is valid JSON
    if (!isJson(parsed)) {
      const errorMetadata = {
        value: typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed),
        type: typeof parsed,
        expected: 'Json',
        context: {
          ...context,
          action: 'parse_metadata',
          component: 'utils'
        }
      };
      throw createCustomValidationError(
        'metadata',
        'Invalid metadata format',
        ValidationErrorCode.INVALID_FORMAT,
        errorMetadata as Json
      );
    }

    // Additional validation for specific types
    if (Array.isArray(parsed)) {
      parsed.forEach((item, index) => {
        if (!isJson(item)) {
          const errorMetadata = {
            value: typeof item === 'object' ? JSON.stringify(item) : String(item),
            type: typeof item,
            expected: 'Json',
            array_index: index,
            context: {
              ...context,
              action: 'validate_array_item',
              component: 'utils'
            }
          };
          throw createCustomValidationError(
            `metadata[${index}]`,
            'Invalid array item format',
            ValidationErrorCode.INVALID_FORMAT,
            errorMetadata as Json
          );
        }
      });
    }

    // Validate object structure if applicable
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      Object.entries(parsed).forEach(([key, value]) => {
        if (!isJson(value)) {
          const errorMetadata = {
            key,
            value: typeof value === 'object' ? JSON.stringify(value) : String(value),
            type: typeof value,
            expected: 'Json',
            context: {
              ...context,
              action: 'validate_object_property',
              component: 'utils'
            }
          };
          throw createCustomValidationError(
            `metadata.${key}`,
            'Invalid property value format',
            ValidationErrorCode.INVALID_FORMAT,
            errorMetadata as Json
          );
        }
      });
    }

    // Type assertion after validation
    return parsed as T;
  });
}

/**
 * Verifies that a user is authenticated
 * Returns a Try monad containing either the session or an error
 */
export async function verifyAuth(client: TypedSupabaseClient) {
  return Try.fromAsync(async () => {
    const { data: { session }, error } = await client.auth.getSession();

    if (error) {
      throw new SupabaseError('Authentication failed', 'AUTH_ERROR', error);
    }

    if (!session) {
      throw new SupabaseError('No active session', 'AUTH_ERROR');
    }

    return session;
  });
}

/**
 * Verify user has admin role
 * Returns a Try monad containing either the session or an error
 */
export async function verifyAdmin(client: TypedSupabaseClient): Promise<Try<Session>> {
  const authResult = await verifyAuth(client);
  
  if (authResult.isFailure()) {
    return authResult;
  }

  const session = authResult.get();
  
  return Try.fromAsync(async () => {
    const { data: employee, error } = await client
      .from('employees')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      throw new SupabaseError('Failed to verify admin status', 'AUTH_ERROR', error);
    }

    if (!employee || employee.role !== 'admin') {
      throw new SupabaseError('User is not an admin', 'FORBIDDEN');
    }

    return session;
  });
} 
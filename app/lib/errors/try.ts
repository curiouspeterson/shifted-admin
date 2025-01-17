/**
 * Try Monad Implementation
 * Last Updated: 2025-01-16
 * 
 * Provides a monadic approach to error handling, allowing for better composition
 * of operations that might fail. Based on functional programming patterns
 * and modern error handling best practices.
 */

import { BaseError, ErrorSeverity, ErrorCategory } from './base';

/**
 * Represents a computation that may either succeed with a value of type T
 * or fail with an error.
 */
export class Try<T> {
  private constructor(
    private readonly value: T | null,
    private readonly error: Error | null
  ) {}

  /**
   * Creates a successful Try with the given value
   */
  static success<T>(value: T): Try<T> {
    return new Try<T>(value, null);
  }

  /**
   * Creates a failed Try with the given error
   */
  static failure<T>(error: Error): Try<T> {
    return new Try<T>(null, error);
  }

  /**
   * Wraps a function that might throw into a Try
   */
  static from<T>(f: () => T): Try<T> {
    try {
      return Try.success(f());
    } catch (error) {
      return Try.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Wraps an async function that might throw into a Promise<Try>
   */
  static async fromAsync<T>(f: () => Promise<T>): Promise<Try<T>> {
    try {
      const result = await f();
      return Try.success(result);
    } catch (error) {
      return Try.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Maps a successful value to a new value
   */
  map<U>(f: (value: T) => U): Try<U> {
    if (this.error) return Try.failure(this.error);
    try {
      return Try.success(f(this.value!));
    } catch (error) {
      return Try.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Chains multiple Try operations together
   */
  flatMap<U>(f: (value: T) => Try<U>): Try<U> {
    if (this.error) return Try.failure(this.error);
    try {
      return f(this.value!);
    } catch (error) {
      return Try.failure(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Recovers from an error by providing a default value
   */
  recover(defaultValue: T): T {
    return this.error ? defaultValue : this.value!;
  }

  /**
   * Recovers from an error by providing a function to handle the error
   */
  recoverWith(f: (error: Error) => T): T {
    return this.error ? f(this.error) : this.value!;
  }

  /**
   * Returns the value if successful, throws the error if failed
   */
  get(): T {
    if (this.error) throw this.error;
    return this.value!;
  }

  /**
   * Returns true if the Try is successful
   */
  isSuccess(): this is Try<T> & { value: T; error: null } {
    return this.error === null;
  }

  /**
   * Returns true if the Try is a failure
   */
  isFailure(): this is Try<T> & { value: null; error: Error } {
    return this.error !== null;
  }

  /**
   * Converts a Try to a Result type
   */
  toResult(): Result<T, Error> {
    return this.error ? 
      { ok: false, error: this.error } : 
      { ok: true, value: this.value! };
  }
}

/**
 * Result type for representing success/failure outcomes
 */
export type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * Helper function to wrap a function that might throw in a Try
 */
export function tryOf<T>(f: () => T): Try<T> {
  return Try.from(f);
}

/**
 * Helper function to wrap an async function that might throw in a Promise<Try>
 */
export function tryOfAsync<T>(f: () => Promise<T>): Promise<Try<T>> {
  return Try.fromAsync(f);
}

/**
 * Creates a Try from a Result type
 */
export function tryFromResult<T>(result: Result<T, Error>): Try<T> {
  return result.ok ? Try.success(result.value) : Try.failure(result.error);
} 
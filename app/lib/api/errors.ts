/**
 * API Errors
 * Last Updated: 2025-01-15
 * 
 * This module provides standardized error classes for API responses.
 */

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
} 
/**
 * API Middleware Utility
 * Last Updated: 2024-03
 * 
 * This module provides middleware functions for request validation,
 * sanitization, and security checks.
 */

import { NextRequest } from 'next/server';
import { AppError } from '../errors';
import { HTTP_STATUS_BAD_REQUEST, HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE } from '../constants/http';

// Constants
const MAX_REQUEST_SIZE = 1024 * 1024; // 1MB
const ALLOWED_CONTENT_TYPES = [
  'application/json',
  'application/x-www-form-urlencoded',
  'multipart/form-data',
];

// CORS configuration
export const corsConfig = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  maxAge: 86400, // 24 hours
};

/**
 * Middleware configuration options
 */
export interface MiddlewareConfig {
  maxSize?: number;
  allowedContentTypes?: string[];
  requireContentType?: boolean;
}

/**
 * Validates request size
 */
export function validateRequestSize(req: NextRequest, maxSize = MAX_REQUEST_SIZE) {
  const contentLength = parseInt(req.headers.get('content-length') || '0', 10);
  if (contentLength > maxSize) {
    throw new AppError(
      `Request size too large. Maximum size is ${maxSize} bytes`,
      HTTP_STATUS_BAD_REQUEST
    );
  }
}

/**
 * Validates content type
 */
export function validateContentType(
  req: NextRequest,
  allowedTypes = ALLOWED_CONTENT_TYPES,
  required = false
) {
  const contentType = req.headers.get('content-type');
  
  // Skip validation for GET requests or if content-type is not required
  if (req.method === 'GET' || (!required && !contentType)) {
    return;
  }

  if (required && !contentType) {
    throw new AppError(
      'Content-Type header is required',
      HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE
    );
  }

  if (contentType && !allowedTypes.some(type => contentType.includes(type))) {
    throw new AppError(
      `Unsupported content type. Allowed types: ${allowedTypes.join(', ')}`,
      HTTP_STATUS_UNSUPPORTED_MEDIA_TYPE
    );
  }
}

/**
 * Sanitizes query parameters
 */
export function sanitizeQuery(searchParams: URLSearchParams): Record<string, string> {
  const sanitized: Record<string, string> = {};
  
  searchParams.forEach((value, key) => {
    // Remove any potential XSS or SQL injection patterns
    const sanitizedValue = value
      .replace(/[<>]/g, '') // Remove < and >
      .replace(/'/g, "'") // Replace single quotes
      .replace(/"/g, '"') // Replace double quotes
      .replace(/;/g, '') // Remove semicolons
      .trim();
    
    sanitized[key] = sanitizedValue;
  });

  return sanitized;
}

/**
 * Sanitizes request body
 */
export function sanitizeBody(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  const sanitized: Record<string, unknown> = {};

  Object.entries(body as Record<string, unknown>).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // Sanitize string values
      sanitized[key] = value
        .replace(/[<>]/g, '')
        .replace(/'/g, "'")
        .replace(/"/g, '"')
        .replace(/;/g, '')
        .trim();
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeBody(value);
    } else {
      // Keep other types as is
      sanitized[key] = value;
    }
  });

  return sanitized;
}

/**
 * Applies CORS headers to the response
 */
export function applyCorsHeaders(req: NextRequest, headers: Headers) {
  const origin = req.headers.get('origin');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    if (origin && corsConfig.allowedOrigins.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin);
      headers.set('Access-Control-Allow-Methods', corsConfig.allowedMethods.join(', '));
      headers.set('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
      headers.set('Access-Control-Max-Age', corsConfig.maxAge.toString());
    }
    return true;
  }

  // Handle actual requests
  if (origin && corsConfig.allowedOrigins.includes(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
  }
  
  return false;
}

/**
 * Creates middleware with the given configuration
 */
export function createMiddleware(config: MiddlewareConfig = {}) {
  return {
    validateRequest: (req: NextRequest) => {
      // Validate request size
      validateRequestSize(req, config.maxSize);

      // Validate content type
      validateContentType(
        req,
        config.allowedContentTypes,
        config.requireContentType
      );

      // Sanitize query parameters
      const sanitizedQuery = sanitizeQuery(req.nextUrl.searchParams);

      return {
        sanitizedQuery,
      };
    },
  };
} 
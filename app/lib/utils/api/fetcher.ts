/**
 * API Fetcher Utility
 * Last Updated: 2025-01-16
 * 
 * Type-safe fetcher utility with error handling and timeout support.
 */

import { ApiError, ApiErrorCode } from '@/lib/errors/api'
import { toast } from 'sonner'

export interface FetcherOptions extends RequestInit {
  /** Request timeout in milliseconds */
  timeout?: number
  /** Number of retry attempts */
  retries?: number
  /** Custom retry delay in milliseconds */
  retryDelay?: number
}

const defaultOptions = {
  timeout: 10000,
  retries: 3,
  retryDelay: 1000
}

/**
 * Creates an AbortController with timeout
 */
function createAbortController(timeoutMs: number = defaultOptions.timeout) {
  const controller = new AbortController()
  if (timeoutMs > 0) {
    setTimeout(() => controller.abort(), timeoutMs)
  }
  return controller
}

/**
 * Calculates exponential backoff delay
 */
function getRetryDelay(attempt: number, baseDelay: number = defaultOptions.retryDelay): number {
  return Math.min(baseDelay * Math.pow(2, attempt), 30000)
}

/**
 * Processes API response and extracts error details
 */
async function handleErrorResponse(response: Response): Promise<never> {
  const contentType = response.headers.get('content-type')
  let errorData: any = {}

  try {
    if (contentType?.includes('application/json')) {
      errorData = await response.json()
    } else {
      errorData.message = await response.text()
    }
  } catch {
    errorData.message = 'Failed to parse error response'
  }

  // Map HTTP status codes to specific error types
  switch (response.status) {
    case 400:
      throw new ApiError(
        errorData.message || 'Bad request',
        400,
        { code: ApiErrorCode.BAD_REQUEST, details: errorData }
      )
    case 401:
      throw new ApiError(
        errorData.message || 'Unauthorized',
        401,
        { code: ApiErrorCode.UNAUTHORIZED }
      )
    case 403:
      throw new ApiError(
        errorData.message || 'Forbidden',
        403,
        { code: ApiErrorCode.FORBIDDEN }
      )
    case 404:
      throw new ApiError(
        errorData.message || 'Not found',
        404,
        { code: ApiErrorCode.NOT_FOUND, resource: errorData.resource }
      )
    default:
      throw new ApiError(
        errorData.message || 'API request failed',
        response.status,
        { code: ApiErrorCode.INTERNAL_ERROR, details: errorData }
      )
  }
}

/**
 * Enhanced fetcher function with error handling and retries
 */
export async function fetcher<T = any>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    timeout = defaultOptions.timeout,
    retries = defaultOptions.retries,
    retryDelay = defaultOptions.retryDelay,
    signal,
    ...init
  } = options

  let attempt = 0

  async function attemptFetch(): Promise<T> {
    const controller = createAbortController(timeout)
    
    try {
      const response = await fetch(input, {
        ...init,
        signal: signal || controller.signal
      })

      if (response.ok) {
        return await response.json()
      }

      await handleErrorResponse(response)
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (!navigator.onLine) {
        toast.error('No internet connection')
        throw new ApiError(
          'No internet connection',
          0,
          { code: ApiErrorCode.SERVICE_UNAVAILABLE }
        )
      }

      // Retry on network errors if attempts remain
      if (attempt < retries) {
        attempt++
        const delay = getRetryDelay(attempt, retryDelay)
        await new Promise(resolve => setTimeout(resolve, delay))
        return attemptFetch()
      }

      // Convert other errors to ApiError
      if (error instanceof Error) {
        throw new ApiError(
          error.message,
          0,
          { code: ApiErrorCode.INTERNAL_ERROR, originalError: error }
        )
      }

      throw new ApiError(
        'An unexpected error occurred',
        0,
        { code: ApiErrorCode.INTERNAL_ERROR, details: error }
      )
    }

    // This should never be reached due to handleErrorResponse
    throw new ApiError(
      'Unexpected error occurred',
      0,
      { code: ApiErrorCode.INTERNAL_ERROR }
    )
  }

  return attemptFetch()
}

/**
 * Mutation fetcher for POST/PUT/DELETE requests
 */
export async function mutationFetcher<T = any>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const {
    method = 'POST',
    headers = {},
    ...rest
  } = options

  return fetcher<T>(input, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...rest,
  })
} 
/**
 * API Fetcher Utility
 * Last Updated: 2025-01-16
 * 
 * Type-safe fetcher utility with error handling and timeout support.
 */

import { ApiError, ApiErrorCode } from '@/lib/errors/api'
import { toast } from 'sonner'
import { Json } from '@/lib/types/json'

export interface FetcherOptions extends RequestInit {
  /** Request timeout in milliseconds */
  timeout?: number
  /** Number of retry attempts */
  retries?: number
  /** Custom retry delay in milliseconds */
  retryDelay?: number
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
  details?: Record<string, unknown>;
  resource?: string;
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
  let errorData: ApiErrorResponse = {}

  try {
    if (contentType?.includes('application/json')) {
      const jsonData = await response.json() as Json
      if (typeof jsonData === 'object' && jsonData !== null) {
        errorData = jsonData as ApiErrorResponse
      }
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
        { code: ApiErrorCode.BAD_REQUEST, details: errorData.details }
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
        { code: ApiErrorCode.INTERNAL_ERROR, details: errorData.details }
      )
  }
}

/**
 * Enhanced fetcher function with error handling and retries
 * @template T - The expected response type
 * @param input - The request URL or Request object
 * @param options - Additional fetch options
 * @returns Promise resolving to the response data
 */
export async function fetcher<T extends Json>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const { timeout, retries = defaultOptions.retries, retryDelay = defaultOptions.retryDelay, ...fetchOptions } = options
  let attempt = 0

  async function attemptFetch(): Promise<T> {
    const controller = createAbortController(timeout)
    try {
      const response = await fetch(input, {
        ...fetchOptions,
        signal: controller.signal
      })

      if (!response.ok) {
        await handleErrorResponse(response)
      }

      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>
      }
      
      throw new ApiError(
        'Invalid response type',
        500,
        { code: ApiErrorCode.INVALID_RESPONSE }
      )
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      if (attempt < retries) {
        attempt++
        const delay = getRetryDelay(attempt, retryDelay)
        await new Promise(resolve => setTimeout(resolve, delay))
        return attemptFetch()
      }

      throw new ApiError(
        'Request failed',
        500,
        { code: ApiErrorCode.REQUEST_FAILED, cause: error }
      )
    }
  }

  return attemptFetch()
}

/**
 * Enhanced mutation fetcher function with error handling and retries
 * @template T - The expected response type
 * @param input - The request URL or Request object
 * @param options - Additional fetch options
 * @returns Promise resolving to the response data
 */
export async function mutationFetcher<T extends Json>(
  input: RequestInfo,
  options: FetcherOptions = {}
): Promise<T> {
  const result = await fetcher<T>(input, {
    ...options,
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  toast.success('Operation completed successfully')
  return result
} 
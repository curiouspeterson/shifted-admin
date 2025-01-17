/**
 * Fetch Utility
 * Last Updated: 2025-03-19
 * 
 * A unified fetch utility that handles both queries and mutations.
 * Includes type safety, error handling, automatic response parsing,
 * request timeouts, retries, and interceptors.
 */

import { HTTP_STATUS, ERROR_CODES } from '@/lib/constants'
import type { ApiResponse, ApiError } from '@/lib/types'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Options for fetch requests
 * @template TBody - The type of the request body
 */
export interface FetchOptions<TBody = unknown> extends Omit<RequestInit, 'body' | 'method' | 'signal'> {
  method?: HttpMethod
  body?: TBody
  params?: Record<string, string>
  headers?: Record<string, string>
  timeout?: number
  retries?: number
  signal?: AbortSignal | null
}

/**
 * Configuration for fetch instance
 */
export interface FetchConfig {
  baseUrl?: string
  defaultHeaders?: Record<string, string>
  defaultTimeout?: number
  maxRetries?: number
  onError?: (error: ApiError) => void
  onResponse?: (response: Response) => void
  requestInterceptor?: (config: RequestInit) => Promise<RequestInit>
  responseInterceptor?: (response: Response) => Promise<Response>
}

const DEFAULT_TIMEOUT = 10000 // 10 seconds
const DEFAULT_MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

/**
 * Creates a configured fetch instance with advanced features
 */
export function createFetch(config: FetchConfig = {}) {
  const {
    baseUrl = '/api',
    defaultHeaders = {
      'Content-Type': 'application/json',
    },
    defaultTimeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    onError,
    onResponse,
    requestInterceptor,
    responseInterceptor,
  } = config

  /**
   * Adds timeout to fetch request
   */
  async function fetchWithTimeout(
    url: string,
    init: RequestInit,
    timeoutMs: number
  ): Promise<Response> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        ...init,
        signal: init.signal ?? controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  /**
   * Retries failed requests
   */
  async function fetchWithRetry(
    url: string,
    init: RequestInit,
    retries: number,
    timeoutMs: number
  ): Promise<Response> {
    try {
      const response = await fetchWithTimeout(url, init, timeoutMs)
      return response
    } catch (error) {
      if (retries > 0 && error instanceof Error && error.name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return fetchWithRetry(url, init, retries - 1, timeoutMs)
      }
      throw error
    }
  }

  /**
   * Main fetch function that handles both queries and mutations
   */
  async function fetchApi<TData = unknown, TBody = unknown>(
    path: string,
    options: FetchOptions<TBody> = {}
  ): Promise<ApiResponse<TData>> {
    const {
      method = 'GET',
      body,
      params,
      headers = {},
      timeout = defaultTimeout,
      retries = maxRetries,
      signal = null,
      ...rest
    } = options

    // Build URL with query parameters
    const url = new URL(path, baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (typeof value === 'string') {
          url.searchParams.append(key, value)
        }
      })
    }

    try {
      // Prepare request init
      let init: RequestInit = {
        method,
        headers: {
          ...defaultHeaders,
          ...headers,
        },
        signal,
        ...rest,
      }

      // Only add body for non-GET requests
      if (method !== 'GET' && body !== undefined) {
        init.body = JSON.stringify(body)
      }

      // Apply request interceptor if provided
      if (requestInterceptor) {
        init = await requestInterceptor(init)
      }

      // Make the request with timeout and retries
      let response = await fetchWithRetry(url.toString(), init, retries, timeout)

      // Apply response interceptor if provided
      if (responseInterceptor) {
        response = await responseInterceptor(response)
      }

      // Call onResponse hook if provided
      if (onResponse) {
        onResponse(response)
      }

      // Parse the response
      const data = await response.json() as ApiResponse<TData>

      // Handle error responses
      if (!response.ok) {
        const error: ApiError = {
          name: 'ApiError',
          message: typeof data.error === 'string' ? data.error : 'An unexpected error occurred',
          code: typeof data.code === 'string' ? data.code : ERROR_CODES.INTERNAL_ERROR,
          status: response.status,
          details: data.details || undefined
        }

        // Call onError hook if provided
        if (onError) {
          onError(error)
        }

        throw error
      }

      return data
    } catch (error) {
      // Handle fetch errors
      const apiError: ApiError = error instanceof Error
        ? {
            name: error.name === 'AbortError' ? 'NetworkError' : 'ApiError',
            message: error.message,
            code: error.name === 'AbortError' ? ERROR_CODES.RATE_LIMIT_ERROR : ERROR_CODES.INTERNAL_ERROR,
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          }
        : {
            name: 'ApiError',
            message: 'An unknown error occurred',
            code: ERROR_CODES.INTERNAL_ERROR,
            status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          }

      // Call onError hook if provided
      if (onError) {
        onError(apiError)
      }

      throw apiError
    }
  }

  /**
   * Convenience methods for common HTTP methods
   */
  return {
    get: <TData = unknown>(path: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
      fetchApi<TData>(path, { ...options, method: 'GET' }),

    post: <TData = unknown, TBody = unknown>(path: string, body: TBody, options?: Omit<FetchOptions, 'method' | 'body'>) =>
      fetchApi<TData, TBody>(path, { ...options, method: 'POST', body }),

    put: <TData = unknown, TBody = unknown>(path: string, body: TBody, options?: Omit<FetchOptions, 'method' | 'body'>) =>
      fetchApi<TData, TBody>(path, { ...options, method: 'PUT', body }),

    patch: <TData = unknown, TBody = unknown>(path: string, body: TBody, options?: Omit<FetchOptions, 'method' | 'body'>) =>
      fetchApi<TData, TBody>(path, { ...options, method: 'PATCH', body }),

    delete: <TData = unknown>(path: string, options?: Omit<FetchOptions, 'method' | 'body'>) =>
      fetchApi<TData>(path, { ...options, method: 'DELETE' }),
  }
}

// Export a default instance
export const api = createFetch() 
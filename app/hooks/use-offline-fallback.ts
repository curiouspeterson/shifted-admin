/**
 * useOfflineFallback Hook
 * Last Updated: 2025-01-16
 * 
 * A hook for handling offline fallback data and error states.
 */

'use client'

import { useEffect, useReducer, useCallback, useRef } from 'react'
import { toast, toastMessages } from '@/lib/utils/toast'
import { formatError, isNetworkError, isOfflineError } from '@/lib/errors/utils'
import { errorLogger } from '@/lib/logging/error-logger'

// Constants
const CHECK_TIMEOUT = 5000
const MAX_RETRIES = 3
const RETRY_DELAY = 5000

interface OfflineFallbackState {
  isOnline: boolean
  isChecking: boolean
  retryCount: number
  lastOnline: number | null
}

interface UseOfflineFallbackOptions {
  onOnline?: () => void
  onOffline?: () => void
  onRetry?: () => void
  onMaxRetries?: () => void
  checkInterval?: number
}

interface UseOfflineFallbackReturn extends OfflineFallbackState {
  retry: () => Promise<void>
  canRetry: boolean
}

/**
 * Get initial online state safely for SSR
 */
function getInitialOnlineState(): boolean {
  if (typeof window === 'undefined') return true
  return navigator.onLine
}

/**
 * Get initial timestamp safely for SSR
 */
function getInitialTimestamp(): number | null {
  if (typeof window === 'undefined') return null
  return navigator.onLine ? Date.now() : null
}

type Action =
  | { type: 'SET_ONLINE'; payload: boolean }
  | { type: 'START_CHECK' }
  | { type: 'END_CHECK' }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }

function reducer(state: OfflineFallbackState, action: Action): OfflineFallbackState {
  switch (action.type) {
    case 'SET_ONLINE':
      return {
        ...state,
        isOnline: action.payload,
        lastOnline: action.payload ? Date.now() : state.lastOnline
      }
    case 'START_CHECK':
      return {
        ...state,
        isChecking: true
      }
    case 'END_CHECK':
      return {
        ...state,
        isChecking: false
      }
    case 'INCREMENT_RETRY':
      return {
        ...state,
        retryCount: state.retryCount + 1
      }
    case 'RESET_RETRY':
      return {
        ...state,
        retryCount: 0
      }
    default:
      return state
  }
}

export function useOfflineFallback({
  onOnline,
  onOffline,
  onRetry,
  onMaxRetries,
  checkInterval = RETRY_DELAY
}: UseOfflineFallbackOptions = {}): UseOfflineFallbackReturn {
  // Refs for callbacks to prevent unnecessary re-renders
  const callbacksRef = useRef({
    onOnline,
    onOffline,
    onRetry,
    onMaxRetries
  })

  // Update callback refs when they change
  useEffect(() => {
    callbacksRef.current = {
      onOnline,
      onOffline,
      onRetry,
      onMaxRetries
    }
  }, [onOnline, onOffline, onRetry, onMaxRetries])

  const [state, dispatch] = useReducer(reducer, {
    isOnline: getInitialOnlineState(),
    isChecking: false,
    retryCount: 0,
    lastOnline: getInitialTimestamp()
  })

  const abortControllerRef = useRef<AbortController>()

  const checkConnection = useCallback(async () => {
    if (state.isChecking || !window.navigator) return

    try {
      dispatch({ type: 'START_CHECK' })

      // Create new AbortController for this check
      abortControllerRef.current = new AbortController()
      const signal = abortControllerRef.current.signal

      // Set timeout to abort fetch
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort()
      }, CHECK_TIMEOUT)

      // Attempt fetch to check connection
      await fetch('/api/health', { signal })

      clearTimeout(timeoutId)
      
      if (!state.isOnline) {
        dispatch({ type: 'SET_ONLINE', payload: true })
        dispatch({ type: 'RESET_RETRY' })
        callbacksRef.current.onOnline?.()
        toast(toastMessages.online.title, {
          description: toastMessages.online.description
        })
      }
    } catch (error) {
      if (state.isOnline) {
        dispatch({ type: 'SET_ONLINE', payload: false })
        callbacksRef.current.onOffline?.()
        toast(toastMessages.offline.title, {
          description: toastMessages.offline.description
        })
      }

      // Log error if not aborted or offline
      if (!isOfflineError(error) && !(error instanceof DOMException)) {
        errorLogger.error('Connection check failed', {
          error: formatError(error),
          retryCount: state.retryCount
        })
      }

      // Increment retry count if network error
      if (isNetworkError(error)) {
        dispatch({ type: 'INCREMENT_RETRY' })
        callbacksRef.current.onRetry?.()

        if (state.retryCount >= MAX_RETRIES) {
          callbacksRef.current.onMaxRetries?.()
          toast(toastMessages.maxRetries.title, {
            description: toastMessages.maxRetries.description
          })
        }
      }
    } finally {
      dispatch({ type: 'END_CHECK' })
    }
  }, [state.isChecking, state.isOnline, state.retryCount])

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE', payload: true })
      void checkConnection()
    }

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE', payload: false })
      callbacksRef.current.onOffline?.()
      toast(toastMessages.offline.title, {
        description: toastMessages.offline.description
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  // Periodic connection check when offline
  useEffect(() => {
    if (typeof window === 'undefined' || state.isOnline) return

    const intervalId = setInterval(checkConnection, checkInterval)
    return () => clearInterval(intervalId)
  }, [state.isOnline, checkConnection, checkInterval])

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  return {
    ...state,
    retry: checkConnection,
    canRetry: state.retryCount < MAX_RETRIES
  }
} 
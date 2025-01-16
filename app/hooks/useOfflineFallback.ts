/**
 * useOfflineFallback Hook
 * Last Updated: 2024-01-16
 * 
 * Manages offline states and connection retries with user feedback.
 */

'use client'

import { useEffect, useReducer, useCallback, useRef } from 'react'
import { toast, toastMessages } from '@/lib/utils/toast'
import { formatError, isNetworkError, isOfflineError } from '@/lib/utils/error'
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
  onMaxRetries
}: UseOfflineFallbackOptions = {}): void {
  const initialState: OfflineFallbackState = {
    isOnline: getInitialOnlineState(),
    isChecking: false,
    retryCount: 0,
    lastOnline: getInitialTimestamp()
  }

  const [state, dispatch] = useReducer(reducer, initialState)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Check connection status
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
        onOnline?.()
        toast(toastMessages.online)
      }
    } catch (error) {
      if (state.isOnline) {
        dispatch({ type: 'SET_ONLINE', payload: false })
        onOffline?.()
        toast(toastMessages.offline)
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
        onRetry?.()

        if (state.retryCount >= MAX_RETRIES) {
          onMaxRetries?.()
          toast(toastMessages.maxRetries)
        }
      }
    } finally {
      dispatch({ type: 'END_CHECK' })
    }
  }, [state.isChecking, state.isOnline, state.retryCount, onOnline, onOffline, onRetry, onMaxRetries])

  // Handle online/offline events
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      dispatch({ type: 'SET_ONLINE', payload: true })
      void checkConnection()
    }

    const handleOffline = () => {
      dispatch({ type: 'SET_ONLINE', payload: false })
      onOffline?.()
      toast(toastMessages.offline)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection, onOffline])

  // Periodic connection check when offline
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.isOnline) return

    const intervalId = setInterval(() => {
      void checkConnection()
    }, RETRY_DELAY)

    return () => clearInterval(intervalId)
  }, [state.isOnline, checkConnection])

  // Cleanup AbortController on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])
} 
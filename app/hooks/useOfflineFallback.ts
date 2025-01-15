/**
 * useOfflineFallback Hook
 * Last Updated: 2024-03-20
 * 
 * Unified hook for managing offline states and connection retries
 * with user feedback.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast, toastMessages } from '@/lib/utils/toast'
import { errorLogger } from '@/lib/logging/error-logger'
import { formatError, createError } from '@/lib/utils/error'

interface OfflineFallbackState {
  isOnline: boolean
  isChecking: boolean
  retryCount: number
  lastOnline: number | null
}

interface UseOfflineFallbackOptions {
  onRetry?: () => Promise<void>
  checkInterval?: number
  maxRetries?: number
  timeoutMs?: number
}

export function useOfflineFallback({
  onRetry,
  checkInterval = 30000,
  maxRetries = 3,
  timeoutMs = 5000
}: UseOfflineFallbackOptions = {}) {
  const [state, setState] = useState<OfflineFallbackState>({
    isOnline: navigator.onLine,
    isChecking: false,
    retryCount: 0,
    lastOnline: navigator.onLine ? Date.now() : null
  })

  // Check connection with timeout
  const checkConnection = useCallback(async () => {
    setState(prev => ({ ...prev, isChecking: true }))
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

      const response = await fetch('/api/health', {
        method: 'HEAD',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      const isOnline = response.ok
      setState(prev => ({
        ...prev,
        isOnline,
        isChecking: false,
        lastOnline: isOnline ? Date.now() : prev.lastOnline,
        retryCount: 0 // Reset retry count on successful connection
      }))

      if (isOnline) {
        toast(toastMessages.online)
      }
    } catch (error) {
      errorLogger.warn('Connection check failed', {
        error: formatError(error),
        retryCount: state.retryCount
      })
      
      setState(prev => ({
        ...prev,
        isOnline: false,
        isChecking: false
      }))
      
      toast(toastMessages.offline)
    }
  }, [timeoutMs])

  // Handle retry attempts
  const retry = useCallback(async () => {
    if (state.retryCount >= maxRetries) {
      toast({
        title: 'Max Retries Reached',
        description: 'Please try again later',
        variant: 'destructive'
      })
      return
    }

    setState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1,
      isChecking: true
    }))

    try {
      await checkConnection()
      if (state.isOnline && onRetry) {
        await onRetry()
      }
    } catch (error) {
      errorLogger.error('Retry attempt failed', {
        error: error instanceof Error ? error : new Error(String(error)),
        retryCount: state.retryCount + 1
      })
      setState(prev => ({
        ...prev,
        isChecking: false
      }))
    }
  }, [state.isOnline, state.retryCount, maxRetries, checkConnection, onRetry])

  // Monitor online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({
        ...prev,
        isOnline: true,
        lastOnline: Date.now(),
        retryCount: 0
      }))
      // Verify connection
      checkConnection()
    }

    const handleOffline = () => {
      setState(prev => ({
        ...prev,
        isOnline: false
      }))
      
      toast({
        title: 'Offline',
        description: 'You are now offline',
        variant: 'destructive'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [checkConnection])

  // Periodic connection checks
  useEffect(() => {
    if (!checkInterval) return

    const interval = setInterval(checkConnection, checkInterval)
    return () => clearInterval(interval)
  }, [checkInterval, checkConnection])

  // Initial connection check
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  return {
    ...state,
    retry,
    canRetry: state.retryCount < maxRetries && !state.isChecking
  }
} 
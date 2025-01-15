/**
 * Service Worker Registration
 * Last Updated: 2024-03-20
 * 
 * This module handles service worker registration and updates,
 * including periodic background sync registration.
 */

import { errorLogger } from '@/lib/logging/error-logger'

interface ServiceWorkerState {
  registration: ServiceWorkerRegistration | null
  updateAvailable: boolean
  offlineReady: boolean
}

interface PeriodicSyncManager {
  register(tag: string, options?: { minInterval: number }): Promise<void>
}

interface ServiceWorkerRegistrationWithPeriodicSync extends ServiceWorkerRegistration {
  periodicSync?: PeriodicSyncManager
}

let state: ServiceWorkerState = {
  registration: null,
  updateAvailable: false,
  offlineReady: false
}

/**
 * Format error for logging
 */
function formatError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause instanceof Error ? {
        name: error.cause.name,
        message: error.cause.message,
        stack: error.cause.stack
      } : undefined
    }
  }
  return {
    name: 'UnknownError',
    message: String(error)
  }
}

/**
 * Register service worker and set up periodic sync
 */
export async function register() {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    }) as ServiceWorkerRegistrationWithPeriodicSync
    state.registration = registration

    // Set up periodic sync if supported
    if (registration.periodicSync) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as PermissionName
      })

      if (status.state === 'granted') {
        await registration.periodicSync.register('sync-data', {
          minInterval: 12 * 60 * 60 * 1000 // 12 hours
        })
      }
    }

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          state.updateAvailable = true
          const broadcast = new BroadcastChannel('sw-updates')
          broadcast.postMessage({ type: 'UPDATE_AVAILABLE' })
        }
      })
    })

    // Set up broadcast channel for sync updates
    const syncChannel = new BroadcastChannel('sync-updates')
    syncChannel.addEventListener('message', (event) => {
      switch (event.data.type) {
        case 'SYNC_COMPLETE':
          state.offlineReady = true
          break
        case 'SYNC_ERROR':
          errorLogger.error('Background sync failed', {
            error: event.data.error,
            request: event.data.request
          })
          break
      }
    })

    return registration
  } catch (error) {
    errorLogger.error('Failed to register service worker', {
      error: formatError(error)
    })
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates() {
  if (!state.registration) return

  try {
    await state.registration.update()
  } catch (error) {
    errorLogger.error('Failed to check for updates', {
      error: formatError(error)
    })
  }
}

/**
 * Apply pending service worker update
 */
export async function applyUpdate() {
  if (!state.registration || !state.updateAvailable) return

  try {
    await state.registration.waiting?.postMessage({ type: 'SKIP_WAITING' })
    window.location.reload()
  } catch (error) {
    errorLogger.error('Failed to apply update', {
      error: formatError(error)
    })
  }
}

/**
 * Trigger immediate sync
 */
export async function syncNow() {
  if (!state.registration) return

  try {
    await state.registration.active?.postMessage({ type: 'SYNC_NOW' })
  } catch (error) {
    errorLogger.error('Failed to trigger sync', {
      error: formatError(error)
    })
  }
}

/**
 * Get current service worker state
 */
export function getState(): ServiceWorkerState {
  return { ...state }
} 
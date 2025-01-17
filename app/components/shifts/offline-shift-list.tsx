/**
 * Offline-Capable Shift List Component
 * Last Updated: 2024-03-20
 * 
 * This component demonstrates the usage of offline functionality hooks
 * with proper error handling and user feedback.
 */

'use client'

import { useOfflineData } from '@/hooks/use-offline-data'
import { useOfflineFallback } from '@/hooks/use-offline-fallback'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import { type Shift } from '@/lib/schemas/base/shift'

interface OfflineShiftListProps {
  storeId: string
}

function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="text-center p-8">
      <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
      <p className="mt-2 text-sm text-gray-500">{error.message}</p>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
      >
        Try again
      </button>
    </div>
  )
}

export default function OfflineShiftList({ storeId }: OfflineShiftListProps) {
  // Offline data management
  const {
    data: shifts,
    isLoading,
    error,
    isSyncing,
    lastSynced,
    saveData,
    syncData
  } = useOfflineData<Shift[]>({
    store: 'shifts',
    id: storeId
  })

  // Offline UI management
  const {
    isOnline,
    isChecking,
    retryCount,
    lastOnline,
    retry,
    canRetry
  } = useOfflineFallback({
    onRetry: syncData,
    checkInterval: 30000,
    maxRetries: 3
  })

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <ErrorBoundary
        fallback={ErrorFallback}
      >
        <div /> {/* ErrorBoundary requires children */}
      </ErrorBoundary>
    )
  }

  // Handle no data state
  if (!shifts || shifts.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No shifts found</p>
        {!isOnline && (
          <p className="mt-2 text-sm">
            You're offline. Some data may not be available.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Offline/Sync Status */}
      <div className="flex items-center justify-between px-4">
        <OfflineIndicator
          isOnline={isOnline}
          isChecking={isChecking}
          lastOnline={lastOnline}
          onRetry={canRetry ? retry : undefined}
        />
        {isSyncing && (
          <span className="text-sm text-gray-500">
            Syncing changes...
          </span>
        )}
        {lastSynced && (
          <span className="text-sm text-gray-500">
            Last synced: {new Date(lastSynced).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Shifts List */}
      <div className="divide-y divide-gray-200">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">{shift.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(shift.start_time).toLocaleString()} - 
                  {new Date(shift.end_time).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {!shift.is_active && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    Inactive
                  </span>
                )}
                {shift.requires_supervisor && (
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    Supervisor Required
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <span className="font-medium">Min. Dispatchers:</span> {shift.min_dispatchers}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 
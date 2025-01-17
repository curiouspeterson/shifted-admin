/**
 * Shifts Page
 * Last Updated: 2024-03-21
 * 
 * This page demonstrates offline functionality with:
 * - Offline data persistence
 * - Background sync
 * - Optimistic updates
 * - Loading states
 */

'use client'

import { Suspense } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOfflineData } from '@/hooks/use-offline-data'
import { useOfflineFallback } from '@/hooks/use-offline-fallback'
import { useSyncQueue } from '@/hooks/use-sync-queue'
import { errorLogger } from '@/lib/logging/error-logger'
import { ShiftList } from '@/components/shifts/shift-list'
import { ShiftForm } from '@/components/shifts/shift-form'
import { SyncStatusIndicator } from '@/components/sync/sync-status-indicator'
import { Spinner } from '@/components/ui/spinner'
import { ErrorBoundary } from '@/components/error/error-boundary'

interface Shift {
  id: string
  startDate: string
  endDate: string
  requirements: string[]
  status: 'pending' | 'approved' | 'rejected'
}

interface ShiftFormData {
  startDate: string
  endDate: string
  requirements: string[]
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
 * Shifts Page Component
 */
export default function ShiftsPage() {
  return (
    <ErrorBoundary
      fallback={({ error }: { error: Error }) => (
        <div className="p-4">
          <h1 className="text-xl font-bold text-red-600">Error Loading Shifts</h1>
          <p className="text-gray-600">{error.message}</p>
        </div>
      )}
    >
      <div className="p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Shifts</h1>
          <SyncStatusIndicator />
        </header>

        <Suspense fallback={<Spinner />}>
          <ShiftsContent />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

/**
 * Shifts Content Component
 */
function ShiftsContent() {
  const queryClient = useQueryClient()

  // Use offline data hook for shifts
  const {
    data: shifts,
    isLoading,
    error: offlineError
  } = useOfflineData<Shift[]>({
    store: 'shifts',
    id: 'all',
    fetcher: async () => {
      const res = await fetch('/api/shifts')
      if (!res.ok) throw new Error('Failed to fetch shifts')
      return res.json()
    }
  })

  // Use sync queue for offline changes
  const { enqueue, isOnline } = useSyncQueue<Shift>(
    'shifts',
    async (op) => {
      const res = await fetch('/api/shifts', {
        method: op.operation === 'create' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(op.data)
      })
      if (!res.ok) throw new Error('Failed to sync shift')
    }
  )

  // Create shift mutation
  const { mutate: createShift, isPending } = useMutation({
    mutationFn: async (formData: ShiftFormData) => {
      // Transform form data to API data
      const shiftData: Omit<Shift, 'id'> = {
        ...formData,
        status: 'pending'
      }

      if (!isOnline) {
        // Handle offline creation
        const newShift = {
          ...shiftData,
          id: crypto.randomUUID()
        }
        await enqueue('create', newShift)
        return newShift
      }

      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shiftData)
      })
      if (!res.ok) throw new Error('Failed to create shift')
      return res.json()
    },
    onMutate: async (formData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['shifts'] })

      // Snapshot previous value
      const previousShifts = queryClient.getQueryData<Shift[]>(['shifts'])

      // Optimistically update
      const optimisticShift: Shift = {
        id: crypto.randomUUID(),
        ...formData,
        status: 'pending'
      }
      queryClient.setQueryData<Shift[]>(['shifts'], old => [
        ...(old || []),
        optimisticShift
      ])

      return { previousShifts }
    },
    onError: (err, newShift, context) => {
      // Revert optimistic update
      queryClient.setQueryData(['shifts'], context?.previousShifts)
      errorLogger.error('Failed to create shift', {
        error: formatError(err),
        shift: newShift
      })
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['shifts'] })
    }
  })

  if (offlineError) {
    errorLogger.error('Failed to load shifts', {
      error: formatError(offlineError)
    })
  }

  return (
    <div className="space-y-6">
      <ShiftForm
        onSubmit={createShift}
        isSubmitting={isPending}
        isOffline={!isOnline}
      />

      <ShiftList
        shifts={shifts || []}
        isOffline={!isOnline}
        isLoading={isLoading}
      />
    </div>
  )
} 
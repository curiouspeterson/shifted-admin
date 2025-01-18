/**
 * Dashboard Page
 * Last Updated: 2025-03-19
 * 
 * Main dashboard view showing overview and key metrics.
 */

'use client'

import { useAppContext } from '@/app/lib/context/app-context'
import { Spinner } from '@/app/components/ui/spinner'
import { useEffect } from 'react'

export default function DashboardPage() {
  const { isLoading, setIsLoading, error, setError } = useAppContext()

  useEffect(() => {
    // Initialize dashboard data
    const initDashboard = async () => {
      try {
        setIsLoading(true)
        // Fetch dashboard data here
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load dashboard'))
      } finally {
        setIsLoading(false)
      }
    }

    initDashboard()
  }, [setIsLoading, setError])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-lg font-semibold">Error Loading Dashboard</h2>
          <p className="text-sm text-gray-600">{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Dashboard</h1>
      {/* Add dashboard content here */}
    </div>
  )
} 
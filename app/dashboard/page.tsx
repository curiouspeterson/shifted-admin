/**
 * Dashboard Page Component
 * Last Updated: 2024-03-20
 * 
 * This is the main dashboard page of the application.
 * It displays the user's schedule and relevant information.
 */

'use client'

import { useApp } from '@/lib/context/app-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useEffect } from 'react'

/**
 * Dashboard Component
 * Displays user's schedule and relevant information
 */
export default function DashboardPage() {
  const { isLoading, setLoading, error, handleError } = useApp()

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        // Load dashboard data here
      } catch (error) {
        handleError(error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [setLoading, handleError])

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">
          <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
          <p>{error.message}</p>
        </div>
      </div>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      {/* Dashboard content goes here */}
    </main>
  )
} 
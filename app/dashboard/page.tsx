/**
 * Dashboard Page Component
 * Last Updated: 2024
 * 
 * A client-side page component that serves as the main dashboard view.
 * Displays a personalized welcome message and provides space for
 * dashboard widgets and overview information.
 * 
 * Features:
 * - Personalized welcome message
 * - Loading state handling
 * - Error display
 * - Responsive grid layout
 * - Employee context integration
 */

'use client'

import { useApp } from '@/app/lib/context/app-context'
import LoadingSpinner from '@/app/components/LoadingSpinner'

/**
 * Dashboard Component
 * Main dashboard view with employee context integration
 * 
 * @returns A responsive dashboard with personalized content
 */
export default function Dashboard() {
  // Get employee data and loading state from context
  const { employee, isLoading, error } = useApp()

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">
          {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Welcome back, {employee?.first_name}
          </h2>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Add dashboard cards/widgets here */}
      </div>
    </div>
  )
} 
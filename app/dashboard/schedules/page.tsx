/**
 * Schedules Page Component
 * Last Updated: 2024
 * 
 * A client-side page component that manages work schedules.
 * Provides functionality to view, create, and manage schedules
 * with real-time updates and responsive design.
 * 
 * Features:
 * - Schedule list display
 * - Create new schedule modal
 * - Status indicators
 * - Loading and error states
 * - Responsive layout
 * - Direct schedule links
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import Modal from '@/app/components/Modal'
import ScheduleForm from '@/app/components/ScheduleForm'

/**
 * Schedule Type
 * Extends the database schedule type with additional fields
 * 
 * @property name - Schedule name/identifier
 * Plus all fields from the database schedule type
 */
type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  name: string
}

/**
 * Schedules Page Component
 * Main component for managing work schedules
 * 
 * @returns A responsive page with schedule management features
 */
export default function SchedulesPage() {
  // State management for schedules and UI
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Load schedules on component mount
  useEffect(() => {
    fetchSchedules()
  }, [])

  /**
   * Schedule Fetcher
   * Retrieves all schedules from the database
   * Ordered by start date (newest first)
   */
  const fetchSchedules = async () => {
    try {
      // Query schedules from Supabase
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) throw error

      setSchedules(data as Schedule[])
    } catch (error) {
      console.error('Error fetching schedules:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch schedules')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create Schedule Handler
   * Opens the create schedule modal
   */
  const handleCreateSchedule = () => {
    setShowCreateModal(true)
  }

  /**
   * Modal Close Handler
   * Closes the create schedule modal
   */
  const handleCloseModal = () => {
    setShowCreateModal(false)
  }

  /**
   * Schedule Save Handler
   * Processes successful schedule creation
   * Refreshes the schedule list
   */
  const handleScheduleSaved = () => {
    setShowCreateModal(false)
    fetchSchedules()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">Loading schedules...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedules</h1>
            <p className="mt-2 text-sm text-gray-700">
              View and manage employee schedules
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleCreateSchedule}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Create Schedule
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-8">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Schedule List */}
        <div className="mt-8 overflow-hidden bg-white shadow sm:rounded-md">
          <ul role="list" className="divide-y divide-gray-200">
            {schedules.map((schedule) => (
              <li key={schedule.id}>
                <Link
                  href={`/dashboard/schedules/${schedule.id}`}
                  className="block hover:bg-gray-50"
                >
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      {/* Schedule Details */}
                      <div className="truncate">
                        <div className="flex">
                          <p className="truncate text-sm font-medium text-indigo-600">
                            {schedule.name}
                          </p>
                          <p className="ml-1 flex-shrink-0 text-sm text-gray-500">
                            ({new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()})
                          </p>
                        </div>
                      </div>
                      {/* Status Badge */}
                      <div className="ml-2 flex flex-shrink-0">
                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          schedule.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Create Schedule Modal */}
      <Modal
        open={showCreateModal}
        onClose={handleCloseModal}
        title="Create New Schedule"
      >
        <ScheduleForm
          onSave={handleScheduleSaved}
          onCancel={handleCloseModal}
        />
      </Modal>
    </div>
  )
} 
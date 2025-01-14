/**
 * Shifts Page Component
 * Last Updated: 2024
 * 
 * A client-side page component that manages shift definitions.
 * Provides functionality to view, create, and edit shifts with
 * real-time updates and responsive design.
 * 
 * Features:
 * - Shift list display
 * - Add/Edit shift modal
 * - Time formatting
 * - Duration calculation
 * - Loading and error states
 * - Responsive table layout
 * - Session validation
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Modal from '@/app/components/Modal'
import { ModalContent, ModalHeader, ModalBody } from '@nextui-org/react'
import ShiftForm from '@/app/components/ShiftForm'

/**
 * Shift Interface
 * Defines the structure of shift data
 * 
 * @property id - Unique identifier for the shift
 * @property name - Shift name/identifier
 * @property start_time - Start time in HH:mm format
 * @property end_time - End time in HH:mm format
 * @property duration_hours - Length of shift in hours
 * @property crosses_midnight - Whether shift spans two days
 * @property min_staff_count - Minimum required staff
 * @property requires_supervisor - Whether supervisor is required
 * @property created_at - Record creation timestamp
 */
interface Shift {
  id: string
  name: string
  start_time: string
  end_time: string
  duration_hours: number
  crosses_midnight: boolean
  min_staff_count: number
  requires_supervisor: boolean
  created_at: string | null
}

/**
 * Shifts Page Component
 * Main component for managing shift definitions
 * 
 * @returns A responsive page with shift management features
 */
export default function ShiftsPage() {
  const router = useRouter()
  
  // State management for shifts and UI
  const [shifts, setShifts] = useState<Shift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [editingShift, setEditingShift] = useState<Shift | null>(null)

  // Load shifts on component mount
  useEffect(() => {
    fetchShifts()
  }, [])

  /**
   * Shift Fetcher
   * Retrieves all shifts from the API with session validation
   */
  const fetchShifts = async () => {
    try {
      // Validate session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      
      if (!session) {
        router.push('/sign-in')
        return
      }

      // Fetch shifts using API route
      const response = await fetch('/api/shifts', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      // Handle unsuccessful fetch
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch shifts')
      }

      // Update state with fetched data
      const { shifts: shiftsData } = await response.json()
      setShifts(shiftsData || [])
      setLoading(false)
    } catch (err) {
      console.error('Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch shifts')
      setLoading(false)
    }
  }

  /**
   * Edit Handler
   * Opens modal with selected shift data for editing
   * 
   * @param shift - Shift record to edit
   */
  const handleEdit = (shift: Shift) => {
    setEditingShift(shift)
    setIsOpen(true)
  }

  /**
   * Add Handler
   * Opens modal for adding a new shift
   */
  const handleAdd = () => {
    setEditingShift(null)
    setIsOpen(true)
  }

  /**
   * Modal Close Handler
   * Closes the shift form modal and resets state
   */
  const handleModalClose = () => {
    setIsOpen(false)
    setEditingShift(null)
  }

  /**
   * Save Handler
   * Processes form submission and updates the shift list
   */
  const handleSave = async () => {
    await fetchShifts()
    handleModalClose()
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading shifts...</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header Section */}
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Shifts</h1>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Shift
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      {/* Shifts Table */}
      <div className="flex flex-col">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden border-t border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                {/* Table Header */}
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Min Staff
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Supervisor
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                {/* Table Body */}
                <tbody className="bg-white divide-y divide-gray-200">
                  {shifts.map((shift) => (
                    <tr key={shift.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {shift.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(`2000-01-01T${shift.start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(`2000-01-01T${shift.end_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {shift.crosses_midnight && ' (Next Day)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shift.duration_hours} hours
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shift.min_staff_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {shift.requires_supervisor ? 'Required' : 'Optional'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(shift)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                  {/* Empty State */}
                  {shifts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No shifts found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Form Modal */}
      <Modal 
        open={isOpen} 
        onClose={handleModalClose}
        title={editingShift ? 'Edit Shift' : 'Add Shift'}
      >
        <ShiftForm
          shiftId={editingShift?.id}
          initialData={editingShift || undefined}
          onSave={handleSave}
          onCancel={handleModalClose}
        />
      </Modal>
    </div>
  )
} 
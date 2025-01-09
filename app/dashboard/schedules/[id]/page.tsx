'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Modal from '@/app/components/Modal'
import ShiftForm from '@/app/components/ShiftForm'

interface Schedule {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'draft' | 'published'
  created_by: string
  created_at: string
}

interface ScheduleShift {
  id: string
  schedule_id: string
  employee_id: string
  start_time: string
  end_time: string
  role: string
  employee?: {
    name: string
  }
}

export default function ScheduleDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [shifts, setShifts] = useState<ScheduleShift[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showShiftModal, setShowShiftModal] = useState(false)
  const [editingShiftId, setEditingShiftId] = useState<string | undefined>(undefined)

  useEffect(() => {
    fetchScheduleData()
  }, [params.id])

  const fetchScheduleData = async () => {
    try {
      // Fetch schedule details
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('id', params.id)
        .single()

      if (scheduleError) throw scheduleError

      setSchedule(scheduleData)
      setName(scheduleData.name)
      setStartDate(scheduleData.start_date.split('T')[0])
      setEndDate(scheduleData.end_date.split('T')[0])

      // Fetch shifts for this schedule with employee names
      const { data: shiftsData, error: shiftsError } = await supabase
        .from('schedule_shifts')
        .select(`
          *,
          employee:employees (
            name
          )
        `)
        .eq('schedule_id', params.id)

      if (shiftsError) throw shiftsError

      setShifts(shiftsData || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          name,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
        })
        .eq('id', params.id)

      if (error) throw error

      setEditing(false)
      fetchScheduleData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update schedule')
    }
  }

  const handlePublish = async () => {
    try {
      const { error } = await supabase
        .from('schedules')
        .update({ status: 'published' })
        .eq('id', params.id)

      if (error) throw error

      fetchScheduleData()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to publish schedule')
    }
  }

  const handleEditShift = (shiftId: string) => {
    setEditingShiftId(shiftId)
    setShowShiftModal(true)
  }

  const handleShiftSave = () => {
    setShowShiftModal(false)
    setEditingShiftId(undefined)
    fetchScheduleData()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading schedule...</div>
      </div>
    )
  }

  if (!schedule) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-red-600">Schedule not found</div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          {editing ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-2xl font-semibold text-gray-900 border-b border-gray-300 focus:border-indigo-500 focus:ring-0"
            />
          ) : (
            <h1 className="text-2xl font-semibold text-gray-900">{schedule.name}</h1>
          )}
          <div className="flex space-x-3">
            {schedule.status === 'draft' && (
              <button
                onClick={handlePublish}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Publish
              </button>
            )}
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            {editing ? (
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900">
                {new Date(schedule.start_date).toLocaleDateString()}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            {editing ? (
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ) : (
              <div className="mt-1 text-sm text-gray-900">
                {new Date(schedule.end_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Shifts</h2>
          <button
            onClick={() => {
              setEditingShiftId(undefined)
              setShowShiftModal(true)
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Shift
          </button>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="overflow-hidden border-t border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        End Time
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {shifts.map((shift) => (
                      <tr key={shift.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {shift.employee?.name || shift.employee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {shift.role}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(shift.start_time).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(shift.end_time).toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditShift(shift.id)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                    {shifts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          No shifts added yet. Click "Add Shift" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        open={showShiftModal}
        onClose={() => {
          setShowShiftModal(false)
          setEditingShiftId(undefined)
        }}
        title={editingShiftId ? 'Edit Shift' : 'Add Shift'}
      >
        <ShiftForm
          scheduleId={params.id}
          shiftId={editingShiftId}
          onSave={handleShiftSave}
          onCancel={() => {
            setShowShiftModal(false)
            setEditingShiftId(undefined)
          }}
        />
      </Modal>
    </div>
  )
} 
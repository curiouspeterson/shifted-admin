'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'

type Schedule = Database['public']['Tables']['schedules']['Row']
type ScheduleAssignment = Database['public']['Tables']['schedule_assignments']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type Shift = Database['public']['Tables']['shifts']['Row']

interface ScheduleWithAssignments extends Schedule {
  assignments: (ScheduleAssignment & {
    employee: Employee
    shift: Shift
  })[]
}

export default function ScheduleDetail({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [schedule, setSchedule] = useState<ScheduleWithAssignments | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  useEffect(() => {
    fetchSchedule()
  }, [params.id])

  const fetchSchedule = async () => {
    try {
      console.log('Fetching schedule:', params.id)
      
      // Fetch schedule with assignments, employees, and shifts
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          assignments:schedule_assignments(
            *,
            employee:employees(*),
            shift:shifts(*)
          )
        `)
        .eq('id', params.id)
        .single()

      console.log('Fetched schedule data:', data)

      if (error) throw error

      // Filter out assignments with null employee or shift
      const validAssignments = data.assignments.filter(
        (assignment): assignment is (typeof assignment & { employee: Employee, shift: Shift }) => 
          assignment.employee !== null && assignment.shift !== null
      )

      console.log('Valid assignments:', validAssignments)

      setSchedule({
        ...data,
        assignments: validAssignments
      } as ScheduleWithAssignments)
    } catch (error) {
      console.error('Error fetching schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch schedule')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!schedule) return
    setPublishing(true)
    setError(null)

    try {
      console.log('Publishing schedule:', schedule.id)
      
      // Validate schedule before publishing
      const { data: assignments } = await supabase
        .from('schedule_assignments')
        .select('*')
        .eq('schedule_id', schedule.id)

      console.log('Schedule assignments:', assignments)

      if (!assignments?.length) {
        throw new Error('Cannot publish schedule without assignments')
      }

      // Get current user's employee record
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      console.log('Current user:', user)

      const { data: employee } = await supabase
        .from('employees')
        .select('id, position')
        .eq('user_id', user.id)
        .single()

      console.log('Employee record:', employee)

      if (!employee) throw new Error('Employee record not found')
      if (employee.position !== 'management') throw new Error('Only managers can publish schedules')

      // Update schedule status to published
      const { error: updateError } = await supabase
        .from('schedules')
        .update({
          status: 'published',
          published_by: employee.id,
          published_at: new Date().toISOString()
        })
        .eq('id', schedule.id)

      if (updateError) throw updateError

      console.log('Successfully published schedule')

      // Refresh schedule data
      await fetchSchedule()
    } catch (error) {
      console.error('Error publishing schedule:', error)
      setError(error instanceof Error ? error.message : 'Failed to publish schedule')
    } finally {
      setPublishing(false)
    }
  }

  const getDatesInRange = (startDate: Date, endDate: Date) => {
    const dates = []
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    return dates
  }

  const getAssignmentsForDate = (date: Date) => {
    if (!schedule) return []
    const dateStr = date.toISOString().split('T')[0]
    return schedule.assignments.filter(assignment => assignment.date === dateStr)
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
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Schedule Details
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex space-x-4 items-center">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            schedule.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {schedule.status}
          </span>
          {schedule.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {publishing ? 'Publishing...' : 'Publish Schedule'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mx-4 my-2 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-sm font-medium text-gray-900">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-4">
          {schedule && (
            <div className="grid grid-cols-7 gap-4">
              {getDatesInRange(new Date(schedule.start_date), new Date(schedule.end_date)).map((date) => {
                const assignments = getAssignmentsForDate(date)
                return (
                  <div
                    key={date.toISOString()}
                    className="min-h-[120px] p-2 border border-gray-200 rounded-lg"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      {date.getDate()}
                    </div>
                    <div className="space-y-2">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="text-xs p-1 rounded bg-indigo-50 border border-indigo-100"
                        >
                          <div className="font-medium text-indigo-700">
                            {assignment.shift.name}
                          </div>
                          <div className="text-indigo-600">
                            {`${assignment.employee.first_name} ${assignment.employee.last_name}`}
                          </div>
                          <div className="text-indigo-500">
                            {assignment.shift.start_time.slice(0, 5)} - {assignment.shift.end_time.slice(0, 5)}
                            {assignment.is_supervisor_shift && (
                              <span className="ml-1 px-1 py-0.5 text-[10px] bg-yellow-100 text-yellow-800 rounded">
                                Supervisor
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
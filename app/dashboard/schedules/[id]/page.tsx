'use client'

import { use } from 'react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Database } from '@/lib/database.types'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Schedule = Database['public']['Tables']['schedules']['Row'] & {
  name: string
}
type ScheduleAssignment = Database['public']['Tables']['schedule_assignments']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type Shift = Database['public']['Tables']['shifts']['Row']

interface Assignment extends ScheduleAssignment {
  employee: Employee
  shift: Shift
}

interface GroupedAssignments {
  [date: string]: {
    [shiftId: string]: Assignment[]
  }
}

export default function ScheduleDetailsPage({ params }: { params: { id: string } }) {
  const scheduleId = use(Promise.resolve(params.id))
  const router = useRouter()
  const [schedule, setSchedule] = useState<Schedule | null>(null)
  const [assignments, setAssignments] = useState<GroupedAssignments>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchScheduleDetails = async () => {
      try {
        // Fetch schedule
        const { data: scheduleData, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('id', scheduleId)
          .single()

        if (scheduleError) throw scheduleError
        if (!scheduleData) throw new Error('Schedule not found')

        setSchedule(scheduleData as Schedule)

        // Fetch assignments with employee and shift details
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('schedule_assignments')
          .select(`
            *,
            employee:employees(*),
            shift:shifts(*)
          `)
          .eq('schedule_id', scheduleId)

        if (assignmentsError) throw assignmentsError

        // Group assignments by date and shift
        const grouped = (assignmentsData || []).reduce((acc: GroupedAssignments, assignment: any) => {
          const date = assignment.date
          const shiftId = assignment.shift_id

          if (!acc[date]) {
            acc[date] = {}
          }
          if (!acc[date][shiftId]) {
            acc[date][shiftId] = []
          }
          acc[date][shiftId].push(assignment)
          return acc
        }, {})

        setAssignments(grouped)
      } catch (err) {
        console.error('Error fetching schedule details:', err)
        setError(err instanceof Error ? err.message : 'Failed to load schedule details')
      } finally {
        setLoading(false)
      }
    }

    fetchScheduleDetails()
  }, [scheduleId])

  const handleEdit = () => {
    router.push(`/dashboard/schedules/edit/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">Loading schedule details...</div>
        </div>
      </div>
    )
  }

  if (error || !schedule) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error || 'Schedule not found'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{schedule.name}</h1>
            <p className="mt-2 text-sm text-gray-500">
              {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleEdit}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Edit Schedule
            </button>
          </div>
        </div>

        {/* Schedule Status */}
        <div className="mb-8 rounded-lg bg-white shadow">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900">Status</h2>
            <div className="mt-2">
              <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                schedule.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Assignments */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assignments</h2>
          {Object.entries(assignments).sort().map(([date, shifts]) => (
            <div key={date} className="mb-8">
              <h3 className="text-md font-medium text-gray-900 mb-4">
                {new Date(date).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <div className="overflow-hidden bg-white shadow sm:rounded-md">
                <ul role="list" className="divide-y divide-gray-200">
                  {Object.entries(shifts).map(([shiftId, shiftAssignments]) => {
                    const shift = shiftAssignments[0]?.shift
                    return (
                      <li key={shiftId}>
                        <div className="px-4 py-4 sm:px-6">
                          <div className="mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              {shift?.name} ({shift?.start_time} - {shift?.end_time})
                            </h4>
                          </div>
                          <ul className="space-y-2">
                            {shiftAssignments.map((assignment: Assignment) => (
                              <li key={assignment.id} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-900">
                                    {assignment.employee.first_name} {assignment.employee.last_name}
                                  </span>
                                  {assignment.is_supervisor_shift && (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                      Supervisor
                                    </span>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 
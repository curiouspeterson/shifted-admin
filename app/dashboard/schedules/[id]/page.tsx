/**
 * Schedule Details Page Component
 * Last Updated: 2024-01-16
 * 
 * A server component that handles fetching and displaying schedule details.
 * Uses server components by default and only switches to client components
 * for interactive features.
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { ScheduleHeader } from './components/schedule-header'
import { ScheduleTimeline } from './components/schedule-timeline'
import { StaffingRequirements } from './components/staffing-requirements'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Schedule, TimeBasedRequirement } from '@/lib/types/scheduling'
import type { GroupedAssignments } from '@/lib/scheduling/utils/schedule.types'
import type { Database } from '@/lib/database/database.types'

/**
 * Loading component for the schedule details
 */
function ScheduleDetailsLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <LoadingSpinner size="lg" />
    </div>
  )
}

interface SchedulePageProps {
  params: {
    id: string
  }
}

export default async function SchedulePage({ params }: SchedulePageProps) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)
  const scheduleId = params.id
  
  try {
    // Fetch schedule details
    const { data: schedule, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()
    
    if (scheduleError) throw scheduleError
    if (!schedule) notFound()

    // Fetch assignments
    const { data: assignmentsList, error: assignmentsError } = await supabase
      .from('assignments')
      .select('*')
      .eq('schedule_id', scheduleId)
    
    if (assignmentsError) throw assignmentsError

    // Fetch time requirements
    const { data: timeRequirements, error: requirementsError } = await supabase
      .from('time_requirements')
      .select('*')
      .eq('schedule_id', scheduleId)
    
    if (requirementsError) throw requirementsError

    // Transform schedule data
    const transformedSchedule: Schedule = {
      id: schedule.id,
      status: schedule.status,
      start_date: schedule.start_date,
      end_date: schedule.end_date,
      created_at: schedule.created_at || new Date().toISOString(),
      created_by: schedule.created_by || '',
      published_at: schedule.published_at || null,
      published_by: schedule.published_by || null,
      version: schedule.version || 1,
      is_active: schedule.is_active ?? false
    }

    // Transform assignments into grouped format
    const transformedAssignments = assignmentsList.reduce<GroupedAssignments>((acc: GroupedAssignments, assignment: Database['public']['Tables']['assignments']['Row']) => {
      const date = assignment.date
      const shiftId = assignment.shift_id
      
      if (!date || !shiftId) return acc
      
      if (!acc[date]) {
        acc[date] = {}
      }
      
      if (!acc[date][shiftId]) {
        acc[date][shiftId] = []
      }
      
      acc[date][shiftId].push(assignment)
      return acc
    }, {})

    // Transform time requirements
    const transformedRequirements: TimeBasedRequirement[] = timeRequirements.map((req: Database['public']['Tables']['time_requirements']['Row']) => ({
      id: req.id,
      schedule_id: scheduleId,
      start_time: req.start_time,
      end_time: req.end_time,
      min_employees: req.min_employees,
      max_employees: req.max_employees,
      min_supervisors: req.min_supervisors,
      day_of_week: req.day_of_week,
      created_at: req.created_at || new Date().toISOString(),
      updated_at: req.updated_at || new Date().toISOString()
    }))

    return (
      <div className="container mx-auto py-8 space-y-8">
        <Suspense fallback={<ScheduleDetailsLoader />}>
          <ScheduleHeader schedule={transformedSchedule} />
          
          {Object.entries(transformedAssignments).map(([date, shifts]) => {
            const allAssignments = shifts ? Object.values(shifts).flat() : []
            
            return (
              <div key={date} className="space-y-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {new Date(date).toLocaleDateString()}
                </h3>
                
                <StaffingRequirements
                  scheduleId={scheduleId}
                  date={date}
                  assignments={allAssignments}
                  timeRequirements={transformedRequirements}
                />
                
                <ScheduleTimeline
                  date={date}
                  shifts={shifts}
                />
              </div>
            )
          })}
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('Error loading schedule:', error)
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">
            {error instanceof Error ? error.message : 'Failed to load schedule'}
          </div>
        </div>
      </div>
    )
  }
} 
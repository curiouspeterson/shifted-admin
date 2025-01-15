/**
 * Schedule Details Page Component
 * Last Updated: 2024-03
 * 
 * A server component that handles fetching and displaying schedule details.
 * Fetches all required data on the server and passes it to client components
 * for interactivity.
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import ScheduleDetailsClient from './ScheduleDetailsClient'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import type { Schedule, TimeBasedRequirement } from '@/lib/types/scheduling'
import type { GroupedAssignments, RequirementStatus } from '@/lib/scheduling/utils/schedule.types'

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
  const scheduleId = params.id
  
  try {
    // Fetch schedule details
    const { data: schedule, error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()
    
    if (scheduleError) throw scheduleError
    if (!schedule) notFound()

    // Fetch assignments
    const { data: assignmentsList, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select('*')
      .eq('schedule_id', scheduleId)
    
    if (assignmentsError) throw assignmentsError

    // Fetch time requirements
    const { data: timeRequirements, error: requirementsError } = await supabaseAdmin
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
    const transformedAssignments = assignmentsList.reduce<GroupedAssignments>((acc, assignment) => {
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
    const transformedRequirements: TimeBasedRequirement[] = timeRequirements.map(req => ({
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

    // Calculate requirement statuses
    const requirementStatuses = calculateRequirementStatuses(transformedRequirements, assignmentsList)

    return (
      <div className="container mx-auto py-8">
        <Suspense fallback={<ScheduleDetailsLoader />}>
          <ScheduleDetailsClient
            schedule={transformedSchedule}
            assignments={transformedAssignments}
            timeRequirements={transformedRequirements}
            requirementStatuses={requirementStatuses}
            error={null}
          />
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

/**
 * Calculate requirement statuses for each time requirement
 * 
 * @param requirements - List of time requirements
 * @param assignments - List of assignments
 * @returns Array of requirement statuses
 */
function calculateRequirementStatuses(
  requirements: TimeBasedRequirement[],
  assignments: any[]
): RequirementStatus[] {
  return requirements.map(requirement => ({
    date: new Date().toISOString().split('T')[0],
    timeBlock: {
      start: requirement.start_time,
      end: requirement.end_time
    },
    required: requirement.min_employees,
    actual: assignments.filter(assignment => 
      assignment.shift_id && 
      assignment.date === new Date().toISOString().split('T')[0]
    ).length,
    type: 'total'
  }))
} 
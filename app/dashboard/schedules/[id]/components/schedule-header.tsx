/**
 * Schedule Header Component
 * Last Updated: 2024-01-16
 * 
 * A server component that provides the header section for schedule details view.
 * Uses server actions for mutations like publishing and deleting schedules.
 */

'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { publishSchedule, unpublishSchedule, deleteSchedule } from '@/lib/actions/schedule'
import type { Schedule } from '@/lib/types/scheduling'

interface ScheduleHeaderProps {
  schedule: Schedule
}

export function ScheduleHeader({ schedule }: ScheduleHeaderProps) {
  const handlePublish = async (formData: FormData) => {
    await publishSchedule(formData.get('id') as string)
  }

  const handleUnpublish = async (formData: FormData) => {
    await unpublishSchedule(formData.get('id') as string)
  }

  const handleDelete = async (formData: FormData) => {
    await deleteSchedule(formData.get('id') as string)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Schedule Details</h1>
            <Badge variant={schedule.status === 'published' ? 'success' : 'secondary'}>
              {schedule.status}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/schedules/edit/${schedule.id}`}
            className="inline-flex items-center justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit
          </Link>
          
          <form action={handlePublish}>
            <input type="hidden" name="id" value={schedule.id} />
            <Button
              type="submit"
              variant="outline"
              disabled={schedule.status === 'published'}
            >
              Publish
            </Button>
          </form>
          
          <form action={handleUnpublish}>
            <input type="hidden" name="id" value={schedule.id} />
            <Button
              type="submit"
              variant="outline"
              disabled={schedule.status !== 'published'}
            >
              Unpublish
            </Button>
          </form>
          
          <form
            action={handleDelete}
            onSubmit={(e) => {
              if (!confirm('Are you sure you want to delete this schedule?')) {
                e.preventDefault()
              }
            }}
          >
            <input type="hidden" name="id" value={schedule.id} />
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Created</h3>
          <p className="mt-1 text-sm">
            {schedule.created_at && new Date(schedule.created_at).toLocaleString()}
            {schedule.created_by && ` by ${schedule.created_by}`}
          </p>
        </div>
        
        {schedule.published_at && (
          <div className="rounded-lg bg-white p-4 shadow">
            <h3 className="text-sm font-medium text-gray-500">Published</h3>
            <p className="mt-1 text-sm">
              {schedule.published_at && new Date(schedule.published_at).toLocaleString()}
              {schedule.published_by && ` by ${schedule.published_by}`}
            </p>
          </div>
        )}
        
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="text-sm font-medium text-gray-500">Version</h3>
          <p className="mt-1 text-sm">{schedule.version}</p>
        </div>
      </div>
    </div>
  )
} 
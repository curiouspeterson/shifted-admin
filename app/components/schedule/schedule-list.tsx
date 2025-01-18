/**
 * Schedule List Component
 * Last Updated: 2025-03-19
 * 
 * Displays a list of schedules with status badges and actions.
 */

'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import type { Route } from 'next'

interface Schedule {
  id: string
  title: string
  description: string | null
  status: 'draft' | 'published' | 'archived'
  created_at: string
}

interface ScheduleListProps {
  schedules: Schedule[]
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Card key={schedule.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{schedule.title}</CardTitle>
              <Badge variant={getStatusVariant(schedule.status)}>
                {schedule.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{schedule.description || 'No description'}</p>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href={`/schedules/edit/${schedule.id}` as Route}>Edit</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/schedules/${schedule.id}` as Route}>View</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function getStatusVariant(status: Schedule['status']) {
  switch (status) {
    case 'published':
      return 'success'
    case 'draft':
      return 'secondary'
    case 'archived':
      return 'destructive'
    default:
      return 'default'
  }
}

export function ScheduleListWrapper() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Schedules</CardTitle>
          <Button asChild>
            <Link href="/schedules/new">Create Schedule</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<ScheduleListSkeleton />}>
          <ScheduleList schedules={[]} />
        </Suspense>
      </CardContent>
    </Card>
  )
}

function ScheduleListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="h-6 w-1/3 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
            <div className="mt-4 flex gap-2">
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 
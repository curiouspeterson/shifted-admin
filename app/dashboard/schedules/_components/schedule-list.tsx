/**
 * Schedule List Component
 * Last Updated: 2025-03-19
 * 
 * Displays a list of schedules with status badges and actions.
 */

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import Link from 'next/link'
import type { Route } from 'next'
import type { Database } from '@/app/lib/types/supabase'

type Schedule = Database['public']['Tables']['schedules']['Row']

interface ScheduleListProps {
  schedules: Schedule[]
}

export default function ScheduleList({ schedules }: ScheduleListProps) {
  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No schedules found.</p>
        </CardContent>
      </Card>
    )
  }

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
            <p className="text-muted-foreground">
              {schedule.description || 'No description'}
            </p>
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
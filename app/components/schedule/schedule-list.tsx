/**
 * Schedule List Component
 * Last Updated: 2024-03-21
 * 
 * Server Component that displays a list of schedules.
 * Uses infinite loading and optimistic updates.
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Schedule {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
}

const statusColors = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800'
} as const;

async function getSchedules(): Promise<Schedule[]> {
  // TODO: Implement schedule fetching
  return [];
}

export async function ScheduleList() {
  const schedules = await getSchedules();
  
  if (schedules.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new schedule.</p>
        <div className="mt-6">
          <Link
            href="/schedules/new"
            className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Create schedule
          </Link>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {schedules.map((schedule) => (
        <Link
          key={schedule.id}
          href={`/schedules/${schedule.id}`}
          className="block"
        >
          <Card className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {schedule.title}
                </h3>
                <div className="mt-1 flex items-center gap-4">
                  <p className="text-sm text-gray-500">
                    {format(new Date(schedule.startDate), 'MMM d, yyyy')} - {format(new Date(schedule.endDate), 'MMM d, yyyy')}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn('capitalize', statusColors[schedule.status])}
                  >
                    {schedule.status}
                  </Badge>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function ScheduleListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ScheduleListWrapper() {
  return (
    <Suspense fallback={<ScheduleListSkeleton />}>
      <ScheduleList />
    </Suspense>
  );
} 
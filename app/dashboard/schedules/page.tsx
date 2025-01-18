/**
 * Schedules Page
 * Last Updated: 2025-03-19
 * 
 * This page displays a list of schedules with filtering and pagination.
 * It allows supervisors to:
 * - View all schedules
 * - Create new schedules
 * - Filter and sort schedules
 * - Navigate to individual schedule details
 */

import { Suspense } from 'react';
import { getSchedules } from '@/app/lib/actions/schedule';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import ScheduleFilters from './_components/schedule-filters';
import ScheduleList from './_components/schedule-list';
import CreateScheduleButton from './_components/create-schedule-button';

interface PageProps {
  searchParams: {
    limit?: string;
    offset?: string;
    sort?: string;
    order?: string;
    status?: string;
  };
}

export default async function SchedulesPage({ searchParams }: PageProps) {
  // Parse query parameters
  const params = {
    limit: searchParams.limit ? parseInt(searchParams.limit) : 10,
    offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
    sort: searchParams.sort as 'start_date' | 'end_date' | 'status' | 'created_at',
    order: searchParams.order as 'asc' | 'desc',
    status: searchParams.status as 'draft' | 'published' | 'archived',
  };

  // Fetch schedules with default values for optional parameters
  const schedules = await getSchedules({
    limit: params.limit,
    offset: params.offset,
    sort: params.sort || 'created_at',
    order: params.order || 'desc',
    status: params.status || 'draft'
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <CreateScheduleButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleFilters />
        </CardContent>
      </Card>

      <Suspense fallback={<ScheduleListSkeleton />}>
        <ScheduleList schedules={schedules} />
      </Suspense>
    </div>
  );
}

function ScheduleListSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="space-y-3">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 
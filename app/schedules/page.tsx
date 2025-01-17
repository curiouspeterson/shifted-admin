/**
 * Schedules List Page
 * Last Updated: 2024-03-21
 * 
 * Server Component that displays a list of schedules with filtering.
 * Uses Suspense for loading states and error boundaries for error handling.
 */

import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { ScheduleListWrapper } from '@/components/schedule/schedule-list';
import { ScheduleFilters } from '@/components/schedule/schedule-filters';

export default function SchedulesPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold">Schedules</h1>
      
      <Suspense fallback={<Spinner size="lg" />}>
        <ScheduleFilters />
      </Suspense>
      
      <ScheduleListWrapper />
    </div>
  );
} 
/**
 * Schedule List Page
 * Last Updated: 2025-01-15
 * 
 * This page displays a list of schedules with filtering and pagination.
 * It uses server components for initial data loading and client components
 * for interactivity.
 */

import { Suspense } from 'react';
import { ScheduleList } from './components/schedule-list';
import { ScheduleFilters } from './components/schedule-filters';
import { PageHeader } from '@/components/ui/page-header';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const metadata = {
  title: 'Schedules | 24/7 Dispatch Center',
  description: 'View and manage dispatch schedules',
};

export default function SchedulesPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <PageHeader
        title="Schedules"
        description="View and manage dispatch schedules"
        action={{
          label: 'Create Schedule',
          href: '/schedules/new',
        }}
      />

      <ScheduleFilters />

      <Suspense fallback={<LoadingSpinner />}>
        <ScheduleList />
      </Suspense>
    </div>
  );
} 
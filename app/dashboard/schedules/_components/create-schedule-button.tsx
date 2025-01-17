/**
 * Create Schedule Button Component
 * Last Updated: 2025-01-17
 * 
 * A button that opens a dialog for creating a new schedule.
 */

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { Route } from 'next';
import { ClientButton } from '@/components/ui';

export function CreateScheduleButton(): React.ReactElement {
  const router = useRouter();

  return (
    <ClientButton onClick={() => router.push('/schedules/new' as Route)}>
      Create Schedule
    </ClientButton>
  );
} 
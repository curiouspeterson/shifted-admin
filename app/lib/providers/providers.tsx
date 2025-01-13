'use client';

import { type PropsWithChildren } from 'react';
import { SWRConfig } from 'swr';
import { ScheduleProvider } from './schedule-provider';
import { fetcher } from '../utils/fetcher';

export function Providers({ children }: PropsWithChildren) {
  return (
    <SWRConfig value={{ fetcher }}>
      <ScheduleProvider>
        {children}
      </ScheduleProvider>
    </SWRConfig>
  );
} 
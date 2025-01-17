/**
 * Error Chart Component
 * Last Updated: 2025-01-15
 * 
 * This component provides a visualization of error trends over time.
 */

'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { ErrorSeverity } from '@/lib/logging/error-logger';

interface ErrorDataPoint {
  date: string;
  critical: number;
  error: number;
  warning: number;
  info: number;
}

const data: ErrorDataPoint[] = [
  {
    date: '2025-01-09',
    critical: 3,
    error: 15,
    warning: 8,
    info: 5,
  },
  {
    date: '2025-01-10',
    critical: 2,
    error: 12,
    warning: 10,
    info: 6,
  },
  {
    date: '2025-01-11',
    critical: 4,
    error: 18,
    warning: 12,
    info: 4,
  },
  {
    date: '2025-01-12',
    critical: 1,
    error: 10,
    warning: 15,
    info: 8,
  },
  {
    date: '2025-01-13',
    critical: 5,
    error: 20,
    warning: 9,
    info: 7,
  },
  {
    date: '2025-01-14',
    critical: 2,
    error: 14,
    warning: 11,
    info: 9,
  },
  {
    date: '2025-01-15',
    critical: 3,
    error: 16,
    warning: 13,
    info: 6,
  },
];

export function ErrorChart() {
  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">Error Trends</h4>
          <p className="text-sm text-muted-foreground">
            Error occurrences over the past 7 days
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm text-muted-foreground">Critical</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-orange-500" />
            <span className="text-sm text-muted-foreground">Error</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <span className="text-sm text-muted-foreground">Warning</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="h-3 w-3 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Info</span>
          </div>
        </div>
      </div>
      <div className="h-[200px] w-full">
        {/* TODO: Implement chart visualization using a charting library */}
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Chart visualization coming soon...
          </p>
        </div>
      </div>
    </div>
  );
} 
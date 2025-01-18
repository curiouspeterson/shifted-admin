/**
 * Error List Component
 * Last Updated: 2025-01-15
 * 
 * This component displays a paginated list of errors with filtering and sorting.
 */

import React from 'react';
import { ErrorSeverity, type ErrorSeverityType } from '@/app/lib/logging/error-logger';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';

interface ErrorEntry {
  id: string;
  message: string;
  severity: ErrorSeverityType;
  timestamp: string;
  path?: string;
  code?: string;
}

const mockErrors: ErrorEntry[] = [
  {
    id: '1',
    message: 'Failed to connect to database',
    severity: ErrorSeverity.ERROR,
    timestamp: '2025-01-15T10:30:00Z',
    path: '/api/data',
    code: 'DB_CONNECTION_ERROR',
  },
  {
    id: '2',
    message: 'Database connection timeout',
    severity: ErrorSeverity.WARN,
    timestamp: '2025-01-15T10:28:00Z',
    path: '/api/schedules',
    code: 'DB_TIMEOUT',
  },
  {
    id: '3',
    message: 'Cache miss for user profile',
    severity: ErrorSeverity.INFO,
    timestamp: '2025-01-15T10:25:00Z',
    path: '/api/users/profile',
    code: 'CACHE_MISS',
  },
];

export function ErrorList() {
  return (
    <div className="space-y-4">
      {mockErrors.map((error) => (
        <Card key={error.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium">
                  {error.message}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {error.timestamp}
                  </span>
                  {error.code ? (
                    <Badge variant="outline" className="text-xs">
                      {error.code}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  error.severity === ErrorSeverity.ERROR
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : error.severity === ErrorSeverity.WARN
                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}
              >
                {error.severity}
              </span>
            </div>
          </CardHeader>
          {error.path ? (
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Path: {error.path}
              </p>
            </CardContent>
          ) : null}
        </Card>
      ))}
    </div>
  );
} 
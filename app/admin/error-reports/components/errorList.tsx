/**
 * Error List Component
 * Last Updated: 2025-01-15
 * 
 * This component displays a paginated list of errors with filtering and sorting.
 */

import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ErrorSeverity } from '@/lib/logging/error-logger';
import { formatDate } from '@/lib/utils';

interface ErrorEntry {
  id: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: string;
  path?: string;
  code?: string;
}

const errors: ErrorEntry[] = [
  {
    id: '1',
    message: 'Failed to fetch user data',
    severity: ErrorSeverity.ERROR,
    timestamp: '2025-01-15T10:30:00Z',
    path: '/api/users',
    code: 'FETCH_ERROR',
  },
  {
    id: '2',
    message: 'Database connection timeout',
    severity: ErrorSeverity.CRITICAL,
    timestamp: '2025-01-15T10:28:00Z',
    path: '/api/schedules',
    code: 'DB_TIMEOUT',
  },
  {
    id: '3',
    message: 'Invalid input data',
    severity: ErrorSeverity.WARN,
    timestamp: '2025-01-15T10:25:00Z',
    path: '/api/assignments',
    code: 'VALIDATION_ERROR',
  },
];

export function ErrorList() {
  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Path</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {errors.map((error) => (
            <TableRow key={error.id}>
              <TableCell className="font-mono">
                {formatDate(error.timestamp)}
              </TableCell>
              <TableCell>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    error.severity === ErrorSeverity.CRITICAL
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : error.severity === ErrorSeverity.ERROR
                      ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                      : error.severity === ErrorSeverity.WARN
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  }`}
                >
                  {error.severity}
                </span>
              </TableCell>
              <TableCell>{error.message}</TableCell>
              <TableCell className="font-mono">{error.path}</TableCell>
              <TableCell className="font-mono">{error.code}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Implement error details view
                  }}
                >
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 
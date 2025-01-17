/**
 * Error Metrics Component
 * Last Updated: 2025-01-15
 * 
 * This component displays key error metrics and statistics.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { ErrorSeverity } from '@/lib/logging/error-logger';

interface ErrorMetric {
  title: string;
  value: number;
  change: number;
  severity: ErrorSeverity;
}

const metrics: ErrorMetric[] = [
  {
    title: 'Total Errors',
    value: 156,
    change: -12,
    severity: ErrorSeverity.ERROR,
  },
  {
    title: 'Critical Errors',
    value: 23,
    change: 5,
    severity: ErrorSeverity.CRITICAL,
  },
  {
    title: 'Warnings',
    value: 89,
    change: -3,
    severity: ErrorSeverity.WARN,
  },
  {
    title: 'Resolved',
    value: 45,
    change: 18,
    severity: ErrorSeverity.INFO,
  },
];

export function ErrorMetrics() {
  return (
    <>
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                metric.severity === ErrorSeverity.CRITICAL
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : metric.severity === ErrorSeverity.ERROR
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  : metric.severity === ErrorSeverity.WARN
                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              }`}
            >
              {metric.severity}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.change > 0 ? '+' : ''}
              {metric.change}% from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </>
  );
} 
/**
 * Error Metrics Component
 * Last Updated: 2025-01-15
 * 
 * This component displays key error metrics and statistics.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ErrorSeverity, type ErrorSeverityType } from '@/app/lib/logging/error-logger';

interface ErrorMetric {
  title: string;
  value: number;
  change: number;
  severity: ErrorSeverityType;
}

const metrics: ErrorMetric[] = [
  {
    title: 'Errors',
    value: 23,
    change: 5,
    severity: ErrorSeverity.ERROR,
  },
  {
    title: 'Warnings',
    value: 45,
    change: -2,
    severity: ErrorSeverity.WARN,
  },
  {
    title: 'Info',
    value: 128,
    change: 12,
    severity: ErrorSeverity.INFO,
  },
];

export function ErrorMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {metric.title}
            </CardTitle>
            <span
              className={`rounded-full px-2 py-1 text-xs ${
                metric.severity === ErrorSeverity.ERROR
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : metric.severity === ErrorSeverity.WARN
                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}
            >
              {metric.severity}
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <p className="text-xs text-muted-foreground">
              {metric.change > 0 ? '+' : ''}{metric.change}% from last week
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
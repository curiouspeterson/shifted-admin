/**
 * Error Chart Component
 * Last Updated: 2025-01-17
 * 
 * Displays error metrics in a visual chart format
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ErrorSeverity } from '@/lib/logging/error-logger';

interface ErrorMetric {
  title: string;
  value: number;
  change: number;
  severity: ErrorSeverity;
}

interface ErrorChartProps {
  data: ErrorMetric[];
  title?: string;
  height?: number;
}

export function ErrorChart({ data, title = 'Error Distribution', height = 300 }: ErrorChartProps) {
  const chartData = useMemo(() => {
    return data.map(metric => ({
      name: metric.title,
      count: metric.value,
      change: metric.change
    }));
  }, [data]);

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div style={{ width: '100%', height }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Error Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
} 
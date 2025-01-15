/**
 * Chart Components
 * Last Updated: 2025-01-15
 * 
 * Reusable chart components built on top of Recharts.
 * Features:
 * - Responsive design
 * - Customizable appearance
 * - Automatic data formatting
 * - Accessibility support
 */

'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ChartProps<T> {
  data: T[];
  xAxis: keyof T;
  yAxis: keyof T;
  height?: number;
  className?: string;
}

const defaultHeight = 300;

export function LineChart<T>({ 
  data, 
  xAxis, 
  yAxis, 
  height = defaultHeight,
  className = ''
}: ChartProps<T>) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxis as string}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey={yAxis as string}
            stroke="#8884d8"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarChart<T>({ 
  data, 
  xAxis, 
  yAxis, 
  height = defaultHeight,
  className = ''
}: ChartProps<T>) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxis as string}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Bar
            dataKey={yAxis as string}
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
          />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
} 
/**
 * Task Monitoring Dashboard
 * Last Updated: 2025-01-15
 * 
 * Real-time monitoring dashboard for database operations and task metrics.
 * Features:
 * - Live task status updates
 * - Performance metrics visualization
 * - Error rate tracking
 * - Task history
 */

import { Suspense } from 'react';
import { TaskMetrics, TaskStatus } from '@/lib/api/database/baseRepository';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, BarChart } from '@/components/ui/charts';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface TaskStatusProps {
  status: TaskStatus;
}

const TaskStatusBadge = ({ status }: TaskStatusProps) => {
  const variants = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    retrying: 'bg-purple-100 text-purple-800'
  };

  return (
    <Badge className={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

interface MetricCardProps {
  title: string;
  value: number;
  description: string;
  trend?: number;
}

const MetricCard = ({ title, value, description, trend }: MetricCardProps) => (
  <Card className="p-4">
    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {trend && (
        <span className={`ml-2 text-sm ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
  </Card>
);

interface TaskHistoryProps {
  tasks: TaskMetrics[];
}

const TaskHistory = ({ tasks }: TaskHistoryProps) => (
  <div className="mt-4">
    <h3 className="text-lg font-medium">Recent Tasks</h3>
    <div className="mt-2 flow-root">
      <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle">
          <table className="min-w-full divide-y divide-gray-300">
            <thead>
              <tr>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Task ID</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Duration</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Retries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.startTime.toString()}>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.startTime.toString()}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <TaskStatusBadge status={task.status} />
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.duration ? `${Math.round(task.duration)}ms` : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {task.retryCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

interface PerformanceMetricsProps {
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageDuration: number;
    totalRetries: number;
  };
}

const PerformanceMetrics = ({ metrics }: PerformanceMetricsProps) => {
  const successRate = metrics.totalTasks > 0 
    ? (metrics.completedTasks / metrics.totalTasks) * 100 
    : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Success Rate"
        value={Math.round(successRate)}
        description="Percentage of successful tasks"
        trend={5}
      />
      <MetricCard
        title="Average Duration"
        value={Math.round(metrics.averageDuration)}
        description="Average task completion time (ms)"
      />
      <MetricCard
        title="Total Tasks"
        value={metrics.totalTasks}
        description="Number of tasks processed"
      />
      <MetricCard
        title="Retry Rate"
        value={Math.round((metrics.totalRetries / metrics.totalTasks) * 100)}
        description="Percentage of tasks that needed retries"
        trend={-2}
      />
    </div>
  );
};

interface TaskMonitoringDashboardProps {
  repository: {
    getTaskMetrics: (taskId: string) => TaskMetrics | undefined;
    getPerformanceMetrics: () => {
      totalTasks: number;
      completedTasks: number;
      failedTasks: number;
      averageDuration: number;
      totalRetries: number;
    };
  };
}

export default function TaskMonitoringDashboard({ repository }: TaskMonitoringDashboardProps) {
  const metrics = repository.getPerformanceMetrics();

  return (
    <ErrorBoundary fallback={<div>Error loading monitoring dashboard</div>}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-6">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Task Monitoring Dashboard
          </h2>
          
          <Suspense fallback={<div>Loading metrics...</div>}>
            <div className="mt-6">
              <PerformanceMetrics metrics={metrics} />
            </div>
          </Suspense>

          <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Suspense fallback={<div>Loading charts...</div>}>
              <Card className="p-4">
                <h3 className="text-lg font-medium">Task Duration Trend</h3>
                <div className="mt-4 h-72">
                  <LineChart
                    data={[/* Add your time series data here */]}
                    xAxis="time"
                    yAxis="duration"
                  />
                </div>
              </Card>

              <Card className="p-4">
                <h3 className="text-lg font-medium">Task Status Distribution</h3>
                <div className="mt-4 h-72">
                  <BarChart
                    data={[
                      { status: 'Completed', count: metrics.completedTasks },
                      { status: 'Failed', count: metrics.failedTasks },
                      { status: 'Retried', count: metrics.totalRetries }
                    ]}
                    xAxis="status"
                    yAxis="count"
                  />
                </div>
              </Card>
            </Suspense>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
} 
/**
 * Monitoring Dashboard Component
 * Last Updated: 2024-03
 */

'use client'

import React from 'react'
import { useQuery } from '@/lib/supabase/hooks'
import { CardSkeleton } from '../loading'
import { ErrorBoundary } from '@/components/error/ErrorBoundary'
import type { Database } from '@/lib/supabase/database.types'

type Tables = Database['public']['Tables']
type PerformanceMetrics = Tables['performance_metrics']['Row']
type ErrorMetrics = Tables['error_metrics']['Row']
type RateLimitMetrics = Tables['rate_limit_metrics']['Row']

// Type guard to ensure metric data is valid
function isMetricData<T>(data: unknown): data is T[] {
  return Array.isArray(data) && data.length > 0
}

interface MetricsCard {
  title: string
  value: string | number
  description: string
  trend?: {
    value: number
    label: string
  }
}

interface Props {
  refreshInterval?: number
}

/**
 * Fetch metrics with proper type handling
 */
export function MonitoringDashboard({ refreshInterval = 30000 }: Props) {
  // Fetch performance metrics
  const { data: performanceData, error: performanceError } = useQuery<'performance_metrics'>(
    'performance_metrics',
    (queryBuilder) => {
      return queryBuilder.order('timestamp', { ascending: false }).limit(1)
    },
    { refetchInterval: refreshInterval }
  )

  // Fetch error metrics
  const { data: errorData, error: errorError } = useQuery<'error_metrics'>(
    'error_metrics',
    (queryBuilder) => {
      return queryBuilder.order('timestamp', { ascending: false }).limit(1)
    },
    { refetchInterval: refreshInterval }
  )

  // Fetch rate limit metrics
  const { data: rateLimitData, error: rateLimitError } = useQuery<'rate_limit_metrics'>(
    'rate_limit_metrics',
    (queryBuilder) => {
      return queryBuilder.order('timestamp', { ascending: false }).limit(1)
    },
    { refetchInterval: refreshInterval }
  )

  // Error handling with type checking
  if (performanceError || errorError || rateLimitError) {
    throw new Error('Failed to fetch metrics')
  }

  // Data validation with type guards
  if (!performanceData || !errorData || !rateLimitData || 
      !isMetricData<PerformanceMetrics>(performanceData) ||
      !isMetricData<ErrorMetrics>(errorData) ||
      !isMetricData<RateLimitMetrics>(rateLimitData)) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const performance = performanceData[0]
  const errors = errorData[0]
  const rateLimits = rateLimitData[0]

  const metrics: MetricsCard[] = [
    {
      title: 'Average Response Time',
      value: `${performance.avg_latency.toFixed(2)}ms`,
      description: 'Average API response time over the last hour',
      trend: {
        value: performance.latency_trend,
        label: 'vs last hour'
      }
    },
    {
      title: 'Error Rate',
      value: `${(errors.error_rate * 100).toFixed(1)}%`,
      description: 'Percentage of requests resulting in errors',
      trend: {
        value: -errors.error_rate_trend,
        label: 'vs last hour'
      }
    },
    {
      title: 'Cache Hit Rate',
      value: `${(performance.cache_hit_rate * 100).toFixed(1)}%`,
      description: 'Percentage of cache hits vs misses',
      trend: {
        value: performance.cache_hit_trend,
        label: 'vs last hour'
      }
    },
    {
      title: 'Rate Limited Requests',
      value: rateLimits.total_limited,
      description: 'Number of rate-limited requests in the last hour',
      trend: {
        value: rateLimits.limit_trend,
        label: 'vs last hour'
      }
    },
    {
      title: '95th Percentile Latency',
      value: `${performance.p95_latency.toFixed(2)}ms`,
      description: '95th percentile of response times',
    },
    {
      title: 'Active Connections',
      value: performance.active_connections,
      description: 'Current number of active connections',
      trend: {
        value: performance.connection_trend,
        label: 'vs last hour'
      }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Recent Errors
        </h3>
        <div className="bg-white shadow-sm rounded-lg border border-gray-100">
          <div className="flow-root">
            <ul className="divide-y divide-gray-200">
              {errors.recent_errors.map((error, index) => (
                <li key={index} className="px-6 py-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {error.message}
                      </p>
                      <p className="text-sm text-gray-500">
                        {error.count} occurrences
                      </p>
                    </div>
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {error.type}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Wrapped monitoring dashboard with error boundary
 */
export default function MonitoringDashboardWithErrorBoundary(props: Props) {
  return (
    <ErrorBoundary>
      <MonitoringDashboard {...props} />
    </ErrorBoundary>
  )
} 
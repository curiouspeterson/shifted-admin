/**
 * Performance Monitoring Dashboard
 * Last Updated: 2024-03
 * 
 * Real-time performance monitoring dashboard for rate limits and system metrics.
 * Features:
 * - Real-time rate limit visualization
 * - Performance metrics tracking
 * - Error rate monitoring
 * - Cache hit rates
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { LineChart } from '@/components/ui/charts/line-chart';
import { BarChart } from '@/components/ui/charts/bar-chart';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@supabase/supabase-js';

interface PerformanceMetrics {
  rateLimits: {
    total: number;
    exceeded: number;
    byRoute: Record<string, number>;
  };
  performance: {
    avgLatency: number;
    p95Latency: number;
    cacheHitRate: number;
  };
  errors: {
    count: number;
    byType: Record<string, number>;
  };
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    rateLimits: { total: 0, exceeded: 0, byRoute: {} },
    performance: { avgLatency: 0, p95Latency: 0, cacheHitRate: 0 },
    errors: { count: 0, byType: {} }
  });

  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('1h');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch metrics from Supabase
  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      
      // Fetch rate limit metrics
      const { data: rateLimitData, error: rateLimitError } = await supabase
        .rpc('get_rate_limit_metrics', { time_range: timeRange });
      
      if (rateLimitError) throw rateLimitError;

      // Fetch performance metrics
      const { data: perfData, error: perfError } = await supabase
        .rpc('get_performance_metrics', { time_range: timeRange });
      
      if (perfError) throw perfError;

      // Fetch error metrics
      const { data: errorData, error: errorError } = await supabase
        .rpc('get_error_metrics', { time_range: timeRange });
      
      if (errorError) throw errorError;

      // Update state with new metrics
      setMetrics({
        rateLimits: rateLimitData,
        performance: perfData,
        errors: errorData
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up polling for real-time updates
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [timeRange]);

  if (isLoading) {
    return <div>Loading metrics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Time Range Selector */}
      <div className="flex justify-end space-x-2">
        <Badge 
          variant={timeRange === '1h' ? 'default' : 'outline'}
          onClick={() => setTimeRange('1h')}
        >
          Last Hour
        </Badge>
        <Badge 
          variant={timeRange === '24h' ? 'default' : 'outline'}
          onClick={() => setTimeRange('24h')}
        >
          24 Hours
        </Badge>
        <Badge 
          variant={timeRange === '7d' ? 'default' : 'outline'}
          onClick={() => setTimeRange('7d')}
        >
          7 Days
        </Badge>
      </div>

      {/* Rate Limits Overview */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Rate Limits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Total Requests</h3>
            <div className="text-2xl font-bold">{metrics.rateLimits.total}</div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Rate Limited</h3>
            <div className="text-2xl font-bold text-red-500">
              {metrics.rateLimits.exceeded}
            </div>
          </div>
        </div>
        <div className="mt-4">
          <LineChart 
            data={Object.entries(metrics.rateLimits.byRoute).map(([route, count]) => ({
              name: route,
              value: count
            }))}
          />
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Performance</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Average Latency</h3>
            <Progress value={metrics.performance.avgLatency} max={200} />
            <div className="text-sm text-gray-500 mt-1">
              {metrics.performance.avgLatency.toFixed(2)}ms
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Cache Hit Rate</h3>
            <Progress value={metrics.performance.cacheHitRate} max={100} />
            <div className="text-sm text-gray-500 mt-1">
              {metrics.performance.cacheHitRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>

      {/* Error Monitoring */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Errors</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Total Errors</h3>
            <div className="text-2xl font-bold text-red-500">
              {metrics.errors.count}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Errors by Type</h3>
            <BarChart 
              data={Object.entries(metrics.errors.byType).map(([type, count]) => ({
                name: type,
                value: count
              }))}
            />
          </div>
        </div>
      </Card>
    </div>
  );
} 
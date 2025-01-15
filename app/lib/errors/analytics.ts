/**
 * Error Analytics Service
 * Last Updated: 2024-03-19 20:40 PST
 * 
 * This service provides error analytics and insights functionality.
 */

import { AppError } from './base';
import { ErrorCategories, ErrorSeverity } from './types';

/**
 * Error trend interface
 */
interface ErrorTrend {
  period: string;
  count: number;
  rate: number;
  topErrors: Array<{
    code: string;
    count: number;
    percentage: number;
  }>;
}

/**
 * Error insight interface
 */
interface ErrorInsight {
  type: 'spike' | 'pattern' | 'correlation';
  severity: ErrorSeverity;
  message: string;
  data: Record<string, any>;
}

/**
 * Error analytics service
 */
export class ErrorAnalyticsService {
  private static instance: ErrorAnalyticsService;
  private errorHistory: Array<{
    timestamp: string;
    error: AppError;
  }> = [];

  private constructor() {
    // Initialize analytics storage
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ErrorAnalyticsService {
    if (!ErrorAnalyticsService.instance) {
      ErrorAnalyticsService.instance = new ErrorAnalyticsService();
    }
    return ErrorAnalyticsService.instance;
  }

  /**
   * Track an error for analytics
   */
  trackError(error: AppError): void {
    this.errorHistory.push({
      timestamp: new Date().toISOString(),
      error,
    });

    // Keep history manageable (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.errorHistory = this.errorHistory.filter(
      ({ timestamp }) => new Date(timestamp) >= thirtyDaysAgo
    );
  }

  /**
   * Get error trends
   */
  getErrorTrends(
    timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): ErrorTrend[] {
    const now = new Date();
    const trends: ErrorTrend[] = [];

    // Calculate period boundaries
    const periods = this.calculatePeriods(timeframe, now);

    // Calculate trends for each period
    periods.forEach(({ start, end, label }) => {
      const periodErrors = this.errorHistory.filter(
        ({ timestamp }) => {
          const date = new Date(timestamp);
          return date >= start && date < end;
        }
      );

      const errorCounts = this.countErrors(periodErrors);
      const duration = (end.getTime() - start.getTime()) / 1000; // seconds

      trends.push({
        period: label,
        count: periodErrors.length,
        rate: periodErrors.length / duration,
        topErrors: this.getTopErrors(errorCounts, 5),
      });
    });

    return trends;
  }

  /**
   * Get error insights
   */
  getInsights(): ErrorInsight[] {
    const insights: ErrorInsight[] = [];

    // Detect error spikes
    const spikes = this.detectErrorSpikes();
    insights.push(...spikes);

    // Detect error patterns
    const patterns = this.detectErrorPatterns();
    insights.push(...patterns);

    // Detect error correlations
    const correlations = this.detectErrorCorrelations();
    insights.push(...correlations);

    return insights;
  }

  /**
   * Calculate time periods for trend analysis
   */
  private calculatePeriods(
    timeframe: 'hour' | 'day' | 'week' | 'month',
    now: Date
  ): Array<{ start: Date; end: Date; label: string }> {
    const periods: Array<{ start: Date; end: Date; label: string }> = [];
    let start: Date;
    let end: Date;

    switch (timeframe) {
      case 'hour':
        // Last 24 hours, hourly intervals
        for (let i = 23; i >= 0; i--) {
          start = new Date(now);
          start.setHours(now.getHours() - i, 0, 0, 0);
          end = new Date(start);
          end.setHours(start.getHours() + 1);
          periods.push({
            start,
            end,
            label: start.toLocaleTimeString([], { hour: '2-digit' }),
          });
        }
        break;

      case 'day':
        // Last 30 days, daily intervals
        for (let i = 29; i >= 0; i--) {
          start = new Date(now);
          start.setDate(now.getDate() - i);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 1);
          periods.push({
            start,
            end,
            label: start.toLocaleDateString(),
          });
        }
        break;

      case 'week':
        // Last 12 weeks, weekly intervals
        for (let i = 11; i >= 0; i--) {
          start = new Date(now);
          start.setDate(now.getDate() - (i * 7));
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(start.getDate() + 7);
          periods.push({
            start,
            end,
            label: `Week ${12 - i}`,
          });
        }
        break;

      case 'month':
        // Last 12 months, monthly intervals
        for (let i = 11; i >= 0; i--) {
          start = new Date(now);
          start.setMonth(now.getMonth() - i, 1);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setMonth(start.getMonth() + 1);
          periods.push({
            start,
            end,
            label: start.toLocaleDateString([], { month: 'short', year: 'numeric' }),
          });
        }
        break;
    }

    return periods;
  }

  /**
   * Count errors by code
   */
  private countErrors(
    errors: Array<{ error: AppError }>
  ): Record<string, number> {
    return errors.reduce((counts, { error }) => {
      counts[error.code] = (counts[error.code] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Get top N errors by count
   */
  private getTopErrors(
    errorCounts: Record<string, number>,
    limit: number
  ): Array<{ code: string; count: number; percentage: number }> {
    const total = Object.values(errorCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(errorCounts)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Detect error spikes
   */
  private detectErrorSpikes(): ErrorInsight[] {
    const insights: ErrorInsight[] = [];
    const hourlyTrends = this.getErrorTrends('hour');
    
    // Calculate average and standard deviation
    const rates = hourlyTrends.map(trend => trend.rate);
    const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    const stdDev = Math.sqrt(
      rates.reduce((sum, rate) => sum + Math.pow(rate - avg, 2), 0) / rates.length
    );

    // Detect spikes (rates > 2 standard deviations from mean)
    hourlyTrends.forEach(trend => {
      if (trend.rate > avg + (2 * stdDev)) {
        insights.push({
          type: 'spike',
          severity: 'warning',
          message: `Error rate spike detected at ${trend.period}`,
          data: {
            period: trend.period,
            rate: trend.rate,
            average: avg,
            standardDeviation: stdDev,
            topErrors: trend.topErrors,
          },
        });
      }
    });

    return insights;
  }

  /**
   * Detect error patterns
   */
  private detectErrorPatterns(): ErrorInsight[] {
    const insights: ErrorInsight[] = [];
    const dailyTrends = this.getErrorTrends('day');

    // Detect increasing trends
    let increasingDays = 0;
    for (let i = 1; i < dailyTrends.length; i++) {
      if (dailyTrends[i].rate > dailyTrends[i - 1].rate) {
        increasingDays++;
      } else {
        increasingDays = 0;
      }

      if (increasingDays >= 3) {
        insights.push({
          type: 'pattern',
          severity: 'warning',
          message: 'Increasing error rate trend detected',
          data: {
            days: increasingDays,
            currentRate: dailyTrends[i].rate,
            startRate: dailyTrends[i - increasingDays].rate,
          },
        });
      }
    }

    return insights;
  }

  /**
   * Detect error correlations
   */
  private detectErrorCorrelations(): ErrorInsight[] {
    const insights: ErrorInsight[] = [];
    const recentErrors = this.errorHistory.slice(-1000); // Last 1000 errors

    // Group errors by code
    const errorsByCode = recentErrors.reduce((groups, { error }) => {
      groups[error.code] = groups[error.code] || [];
      groups[error.code].push(error);
      return groups;
    }, {} as Record<string, AppError[]>);

    // Look for correlated error codes
    Object.entries(errorsByCode).forEach(([code, errors]) => {
      const otherErrors = recentErrors.filter(
        ({ error }) => error.code !== code &&
          Math.abs(
            new Date(error.metadata.timestamp).getTime() -
            new Date(errors[0].metadata.timestamp).getTime()
          ) <= 60000 // Within 1 minute
      );

      if (otherErrors.length > 0) {
        const correlatedCodes = Array.from(
          new Set(otherErrors.map(({ error }) => error.code))
        );
        
        if (correlatedCodes.length > 0) {
          insights.push({
            type: 'correlation',
            severity: 'info',
            message: `Error correlation detected with ${code}`,
            data: {
              primaryCode: code,
              correlatedCodes,
              occurrences: otherErrors.length,
            },
          });
        }
      }
    });

    return insights;
  }
}

/**
 * Get error analytics instance
 */
export function getErrorAnalytics(): ErrorAnalyticsService {
  return ErrorAnalyticsService.getInstance();
}

/**
 * Track error for analytics
 */
export function trackErrorAnalytics(error: AppError): void {
  ErrorAnalyticsService.getInstance().trackError(error);
}

/**
 * Get error trends
 */
export function getErrorTrends(
  timeframe?: 'hour' | 'day' | 'week' | 'month'
): ErrorTrend[] {
  return ErrorAnalyticsService.getInstance().getErrorTrends(timeframe);
}

/**
 * Get error insights
 */
export function getErrorInsights(): ErrorInsight[] {
  return ErrorAnalyticsService.getInstance().getInsights();
} 
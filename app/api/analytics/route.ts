/**
 * Analytics API Route
 * Last Updated: 2024-03-19
 * 
 * Handles incoming analytics events and stores them in the database.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandler } from '@/lib/api';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { errorLogger } from '@/lib/logging/error-logger';
import type { ApiResponse } from '@/lib/api/types';
import { RateLimiter } from '@/lib/rate-limiting';

// Validation schema for analytics events
const EventPropertiesSchema = z.record(z.unknown());

const AnalyticsEventSchema = z.object({
  type: z.string(),
  name: z.string(),
  properties: EventPropertiesSchema.nullable(),
  timestamp: z.string().datetime(),
  sessionId: z.string(),
  userId: z.string().nullable(),
  path: z.string(),
  referrer: z.string().nullable(),
});

const RequestSchema = z.object({
  events: z.array(AnalyticsEventSchema),
});

type AnalyticsEvent = z.infer<typeof AnalyticsEventSchema>;
type AnalyticsRequest = z.infer<typeof RequestSchema>;
type AnalyticsResponse = { success: boolean };

// Create rate limiter for analytics events
const rateLimiter = new RateLimiter({
  points: 100,
  duration: 60, // 1 minute
  blockDuration: 300, // 5 minutes
  keyPrefix: 'analytics:events'
});

export const POST = createRouteHandler<AnalyticsResponse, AnalyticsRequest>({
  rateLimit: rateLimiter,
  validate: {
    body: RequestSchema
  },
  handler: async (
    req: NextRequest,
    validated: { body: AnalyticsRequest }
  ): Promise<NextResponse<ApiResponse<AnalyticsResponse>>> => {
    try {
      const supabase = createClient();
      const { events } = validated.body;

      // Batch insert events
      const { error } = await supabase
        .from('analytics_events')
        .insert(events.map((event: AnalyticsEvent) => ({
          ...event,
          client_timestamp: event.timestamp,
          server_timestamp: new Date().toISOString(),
        })));

      if (error) {
        throw error;
      }

      return NextResponse.json<ApiResponse<AnalyticsResponse>>({
        data: { success: true }
      });
    } catch (error) {
      errorLogger.error('Failed to store analytics events', {
        error,
        component: 'analytics-api',
      });
      throw error;
    }
  },
}); 
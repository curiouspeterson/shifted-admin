/**
 * Logs API Route Handler
 * Last Updated: 2025-01-17
 * 
 * Handles incoming log entries and stores them appropriately
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiLogger } from '@/lib/api/logger';

const logEntrySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  timestamp: z.string().datetime(),
  context: z.record(z.unknown()).optional(),
});

const logsPayloadSchema = z.object({
  logs: z.array(logEntrySchema),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const { logs } = logsPayloadSchema.parse(json);

    // In production, you would store these logs in a proper logging service
    // For now, we'll just log them using the API logger
    for (const log of logs) {
      await apiLogger[log.level](log.message, {
        ...log.context,
        clientTimestamp: log.timestamp,
      });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    await apiLogger.error('Failed to process logs', { error });
    return new Response(
      JSON.stringify({ error: 'Invalid log format' }),
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export async function GET() {
  // This endpoint could be used to retrieve logs in development
  // In production, you would typically use a proper logging service UI
  if (process.env.NODE_ENV !== 'development') {
    return new Response(
      JSON.stringify({ error: 'Not available in production' }),
      { 
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(
    JSON.stringify({ message: 'Logs endpoint is working' }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
} 
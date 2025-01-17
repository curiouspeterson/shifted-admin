/**
 * Sentry Example API Route
 * Last Updated: 2025-01-17
 * 
 * Example route to demonstrate Sentry error monitoring.
 */

import { createRouteHandler } from '@/lib/api';
import { Errors } from '@/lib/errors/types';

export const dynamic = "force-dynamic";

// A faulty API route to test Sentry's error monitoring
export const GET = createRouteHandler({
  handler: async () => {
    throw Errors.unknown("Sentry Example API Route Error");
  }
});

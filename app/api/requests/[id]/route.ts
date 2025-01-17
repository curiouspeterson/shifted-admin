/**
 * Request API Route Handler
 * Last Updated: 2024-01-17
 * 
 * This file implements the request management endpoints.
 */

import { createRouteHandler } from '@/lib/api/handler';
import { AppError, NotFoundError } from '@/lib/errors/base';
import { createServerClient } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/api/handler';

export const GET = createRouteHandler({
  methods: ['GET'],
  handler: async ({ request }) => {
    const id = request.url.split('/').pop();
    if (!id) {
      throw new AppError('Request ID is required', 'VALIDATION_ERROR', 400);
    }

    const supabase = createServerClient();
    const { data: request_data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new AppError(error.message, 'DATABASE_ERROR', 500);
    }

    if (!request_data) {
      throw new NotFoundError('Request not found');
    }

    return {
      data: request_data
    };
  }
}); 
/**
 * Sync API Route Handler
 * Last Updated: 2025-03-19
 * 
 * Handles sync operations using Next.js 14 Route Handlers
 */

import { NextResponse } from 'next/server';
import { type SyncOperation } from '@/lib/types/sync';
import { errorLogger } from '@/lib/logging/error-logger';
import { headers } from 'next/headers';
import { z } from 'zod';

// Type guard for sync operation payload
function isValidPayload(payload: unknown): payload is Record<string, unknown> {
  return typeof payload === 'object' && payload !== null;
}

// Type guard for operation type
function isValidOperationType(type: unknown): type is SyncOperation['type'] {
  return type === 'create' || type === 'update' || type === 'delete';
}

// Response validation schema
const responseSchema = z.object({
  success: z.boolean(),
  data: z.unknown()
});

export async function POST(request: Request) {
  try {
    const operation = await request.json() as SyncOperation;
    const headersList = headers();
    
    // Validate the operation
    if (!operation.id || !isValidOperationType(operation.type) || !operation.endpoint) {
      return NextResponse.json(
        { error: 'Invalid operation format' },
        { status: 400 }
      );
    }

    // Prepare request options with proper type handling
    const requestInit: RequestInit = {
      method: operation.type === 'delete' ? 'DELETE' : operation.type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': headersList.get('authorization') ?? ''
      }
    };

    // Only add body for non-DELETE requests with valid payload
    if (operation.type !== 'delete' && operation.payload && isValidPayload(operation.payload)) {
      requestInit.body = JSON.stringify(operation.payload);
    }

    const response = await fetch(operation.endpoint, requestInit);

    if (!response.ok) {
      throw new Error(`Failed to process operation: ${response.statusText}`);
    }

    const result = await response.json();
    const validatedResult = responseSchema.parse(result);

    return NextResponse.json(validatedResult);
  } catch (error) {
    errorLogger.error('Failed to process sync operation', { error });
    
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // This would typically fetch from your database
    // For now, we'll return a mock response
    return NextResponse.json({
      operations: [],
      stats: {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        lastSync: null,
        lastError: null,
      },
    });
  } catch (error) {
    errorLogger.error('Failed to fetch sync operations', { error });
    
    return NextResponse.json(
      { error: 'Failed to fetch operations' },
      { status: 500 }
    );
  }
} 
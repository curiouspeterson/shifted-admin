/**
 * Sync API Route Handler
 * Last Updated: 2025-01-16
 * 
 * Handles sync operations using Next.js 14 Route Handlers
 */

import { NextResponse } from 'next/server';
import { type SyncOperation } from '@/lib/types/sync';
import { errorLogger } from '@/lib/logging/error-logger';
import { headers } from 'next/headers';

export async function POST(request: Request) {
  try {
    const operation = await request.json() as SyncOperation;
    const headersList = headers();
    
    // Validate the operation
    if (!operation.id || !operation.type || !operation.endpoint) {
      return NextResponse.json(
        { error: 'Invalid operation format' },
        { status: 400 }
      );
    }

    // Process the operation based on type
    const response = await fetch(operation.endpoint, {
      method: operation.type === 'delete' ? 'DELETE' : operation.type === 'create' ? 'POST' : 'PUT',
      headers: {
        'Content-Type': 'application/json',
        // Forward necessary headers
        'Authorization': headersList.get('authorization') || '',
      },
      body: operation.type !== 'delete' ? JSON.stringify(operation.payload) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Failed to process operation: ${response.statusText}`);
    }

    const result = await response.json();

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    errorLogger.error('Failed to process sync operation', { error });
    
    return NextResponse.json(
      { error: 'Failed to process operation' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
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
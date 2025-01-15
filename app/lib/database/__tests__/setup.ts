/**
 * Database Testing Setup
 * Last Updated: 2024-03-19 19:20 PST
 * 
 * This file provides test utilities, mocks, and fixtures for database tests.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseRecord } from '../base/types';

/**
 * Mock data type for testing
 */
export interface TestRecord extends DatabaseRecord {
  name: string;
  value: number;
  isActive: boolean;
  version: number; // Required for optimistic locking tests
}

/**
 * Create a mock Supabase client for testing
 */
export function createMockSupabaseClient(): jest.Mocked<SupabaseClient> {
  const mockSingle = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();
  const mockRpc = jest.fn();
  const mockOrder = jest.fn();
  const mockLimit = jest.fn();
  const mockRange = jest.fn();

  // Create the mock chain
  mockSelect.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    '*': mockSelect,
    order: mockOrder,
    limit: mockLimit,
    range: mockRange,
  });

  mockEq.mockReturnValue({
    single: mockSingle,
    select: mockSelect,
  });

  mockInsert.mockReturnValue({
    select: mockSelect,
  });

  mockUpdate.mockReturnValue({
    eq: mockEq,
    select: mockSelect,
  });

  mockDelete.mockReturnValue({
    eq: mockEq,
  });

  mockOrder.mockReturnValue({
    limit: mockLimit,
    range: mockRange,
  });

  mockLimit.mockReturnValue({
    range: mockRange,
  });

  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  // Create the mock client
  return {
    from: mockFrom,
    rpc: mockRpc,
  } as unknown as jest.Mocked<SupabaseClient>;
}

/**
 * Create mock test data
 */
export function createMockData(count: number = 1): TestRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `test-${index + 1}`,
    name: `Test Record ${index + 1}`,
    value: index + 1,
    isActive: true,
    version: 1, // Initial version
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }));
}

/**
 * Mock error responses
 */
export const mockErrors = {
  notFound: {
    code: 'PGRST116',
    message: 'Record not found',
  },
  uniqueViolation: {
    code: '23505',
    message: 'Unique violation',
  },
  foreignKeyViolation: {
    code: '23503',
    message: 'Foreign key violation',
  },
  serializationFailure: {
    code: '40001',
    message: 'Serialization failure',
  },
  deadlockDetected: {
    code: '40P01',
    message: 'Deadlock detected',
  },
};

/**
 * Test utilities
 */
export const testUtils = {
  /**
   * Wait for a specified time
   */
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Create a mock error
   */
  createError: (code: string, message: string) => ({
    code,
    message,
    details: message,
    hint: '',
  }),

  /**
   * Assert that a function was called with retry
   */
  assertRetry: async (
    func: jest.Mock,
    expectedCalls: number,
    timeout: number = 1000
  ) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (func.mock.calls.length === expectedCalls) {
        return;
      }
      await testUtils.delay(10);
    }
    throw new Error(
      `Expected ${expectedCalls} calls but got ${func.mock.calls.length}`
    );
  },
}; 
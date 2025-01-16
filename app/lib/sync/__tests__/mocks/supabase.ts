/**
 * Supabase Client Mock
 * Last Updated: 2024-01-15
 * 
 * Provides a mock implementation of the Supabase client for testing.
 */

import { Database } from '@/lib/database/database.types'
import { SupabaseClient } from '@supabase/supabase-js'

// Mock response type
type MockResponse<T> = {
  data: T | null
  error: { code: string; message: string } | null
}

// Mock query builder
class MockQueryBuilder<T> {
  private mockResponse: MockResponse<T> = { data: null, error: null }

  insert = jest.fn().mockReturnThis()
  update = jest.fn().mockReturnThis()
  delete = jest.fn().mockReturnThis()
  select = jest.fn().mockReturnThis()
  eq = jest.fn().mockImplementation(() => {
    return Promise.resolve(this.mockResponse)
  })

  mockReturnValue(response: MockResponse<T>) {
    this.mockResponse = response
    return this
  }
}

// Create mock Supabase client
export function createMockSupabaseClient() {
  const mockQueryBuilder = new MockQueryBuilder()

  const mock = {
    from: jest.fn().mockReturnValue(mockQueryBuilder),
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  } as unknown as jest.Mocked<SupabaseClient<Database>>

  return {
    client: mock,
    queryBuilder: mockQueryBuilder
  }
} 
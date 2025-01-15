/**
 * Transaction Integration Tests
 * Last Updated: 2024-03-19 19:15 PST
 * 
 * This file contains integration tests for database transactions,
 * testing rollback mechanisms, concurrent modifications, and error handling.
 */

import { BaseRepository } from '../../base/repository';
import { DatabaseRecord, DatabaseResult } from '../../base/types';
import { TransactionManager } from '../../base/transaction';
import {
  TestRecord,
  createMockSupabaseClient,
  createMockData,
  mockErrors,
  testUtils,
} from '../setup';

/**
 * Test repository implementation
 */
class TestRepository extends BaseRepository<TestRecord> {
  constructor() {
    const mockClient = createMockSupabaseClient();
    super(mockClient, 'test_table');
  }
}

describe('Transaction Integration', () => {
  let repository: TestRepository;
  let transactionManager: TransactionManager;
  let mockData: TestRecord[];

  beforeEach(() => {
    repository = new TestRepository();
    transactionManager = new TransactionManager(repository['supabase']);
    mockData = createMockData(3);
  });

  describe('Transaction Execution', () => {
    it('should successfully execute a transaction', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await transactionManager.transaction<TestRecord>(async (client) => {
        const record = await repository.findById('test-1');
        if (record.error) return record;
        
        const updated = await repository.update('test-1', { value: 100 });
        return updated;
      });

      // Assert
      expect(result.error).toBeNull();
      expect(mockClient.rpc).toHaveBeenCalledWith('begin_transaction');
      expect(mockClient.rpc).toHaveBeenCalledWith('commit_transaction');
    });

    it('should rollback on error', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.rpc.mockResolvedValue({ data: null, error: null });
      const error = new Error('Test error');

      // Act
      const result = await transactionManager.transaction<TestRecord>(async () => {
        throw error;
      });

      // Assert
      expect(result.error).toBeDefined();
      expect(mockClient.rpc).toHaveBeenCalledWith('begin_transaction');
      expect(mockClient.rpc).toHaveBeenCalledWith('rollback_transaction');
    });
  });

  describe('Concurrent Modifications', () => {
    it('should handle optimistic locking', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      
      // Simulate concurrent modification
      mockClient.from().select().eq().single
        .mockResolvedValueOnce({ data: record, error: null })
        .mockResolvedValueOnce({ 
          data: { ...record, version: record.version + 1 },
          error: null 
        });

      // Act
      const result = await transactionManager.transaction<TestRecord>(async () => {
        const original = await repository.findById(record.id);
        if (original.error) return original;
        
        await testUtils.delay(100); // Simulate delay
        return await repository.update(record.id, { value: 200 });
      });

      // Assert
      expect(result.error?.code).toBe('CONFLICT');
      expect(mockClient.rpc).toHaveBeenCalledWith('rollback_transaction');
    });

    it('should retry on serialization failures', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.rpc
        .mockRejectedValueOnce(mockErrors.serializationFailure)
        .mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await transactionManager.transaction<TestRecord>(async () => {
        return await repository.findById('test-1');
      });

      // Assert
      expect(result.error).toBeNull();
      await testUtils.assertRetry(mockClient.rpc, 2);
    });
  });

  describe('Complex Transactions', () => {
    it('should handle nested operations', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const operations = [
        { id: 'test-1', value: 100 },
        { id: 'test-2', value: 200 },
        { id: 'test-3', value: 300 },
      ];

      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockData[0],
        error: null,
      });

      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockData[0], value: 100 },
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await transactionManager.transactionArray<TestRecord>(async () => {
        const results: TestRecord[] = [];
        for (const op of operations) {
          const updated = await repository.update(op.id, { value: op.value });
          if (updated.error) {
            return { data: null, error: updated.error };
          }
          if (updated.data) {
            results.push(updated.data);
          }
        }
        return { data: results, error: null };
      });

      // Assert
      expect(result.error).toBeNull();
      expect(mockClient.rpc).toHaveBeenCalledWith('begin_transaction');
      expect(mockClient.rpc).toHaveBeenCalledWith('commit_transaction');
      expect(mockClient.from().update).toHaveBeenCalledTimes(3);
    });

    it('should handle deadlock scenarios', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.rpc
        .mockRejectedValueOnce(mockErrors.deadlockDetected)
        .mockResolvedValueOnce({ data: null, error: null });

      // Act
      const result = await transactionManager.transactionArray<TestRecord>(async () => {
        const record1 = await repository.update('test-1', { value: 100 });
        if (record1.error) return { data: null, error: record1.error };
        if (!record1.data) return { data: null, error: new Error('Record 1 not found') };

        const record2 = await repository.update('test-2', { value: 200 });
        if (record2.error) return { data: null, error: record2.error };
        if (!record2.data) return { data: null, error: new Error('Record 2 not found') };

        return { data: [record1.data, record2.data], error: null };
      });

      // Assert
      expect(result.error).toBeNull();
      await testUtils.assertRetry(mockClient.rpc, 2);
    });
  });
}); 
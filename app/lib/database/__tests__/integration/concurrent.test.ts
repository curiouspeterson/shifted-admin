/**
 * Concurrent Operations Tests
 * Last Updated: 2024-03-19 18:05 PST
 * 
 * This file contains tests for concurrent database operations,
 * focusing on race conditions, locking, and conflict resolution.
 */

import { BaseRepository } from '../../base/repository';
import { DatabaseRecord } from '../../base/types';
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

describe('Concurrent Operations', () => {
  let repository: TestRepository;
  let transactionManager: TransactionManager;
  let mockData: TestRecord[];

  beforeEach(() => {
    repository = new TestRepository();
    transactionManager = new TransactionManager(repository['supabase']);
    mockData = createMockData(3);
  });

  describe('Parallel Updates', () => {
    it('should handle multiple concurrent updates', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      const updates = [
        { value: 100 },
        { value: 200 },
        { value: 300 },
      ];

      // Simulate version changes between updates
      let version = 1;
      mockClient.from().select().eq().single.mockImplementation(() => ({
        data: { ...record, version: version++ },
        error: null,
      }));

      // Act
      const results = await Promise.all(
        updates.map(update => repository.update(record.id, update))
      );

      // Assert
      expect(results.some(r => r.error?.code === 'CONFLICT')).toBe(true);
      expect(results.filter(r => !r.error)).toHaveLength(1);
    });

    it('should retry failed operations with backoff', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      
      mockClient.from().select().eq().single
        .mockRejectedValueOnce(mockErrors.serializationFailure)
        .mockRejectedValueOnce(mockErrors.serializationFailure)
        .mockResolvedValueOnce({ data: record, error: null });

      // Act
      const result = await repository.findById(record.id);

      // Assert
      expect(result.error).toBeNull();
      await testUtils.assertRetry(mockClient.from().select().eq().single, 3);
    });
  });

  describe('Race Conditions', () => {
    it('should detect and handle read-modify-write races', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      
      // Simulate concurrent modification between read and write
      mockClient.from().select().eq().single.mockResolvedValue({
        data: record,
        error: null,
      });

      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockRejectedValue(mockErrors.serializationFailure),
          }),
        }),
      });

      // Act
      const results = await Promise.all([
        repository.update(record.id, { value: 100 }),
        repository.update(record.id, { value: 200 }),
      ]);

      // Assert
      expect(results.some(r => r.error?.code === 'SERIALIZATION_FAILURE')).toBe(true);
    });

    it('should maintain data consistency under concurrent load', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      const operations = Array(5).fill(null).map((_, i) => ({
        type: i % 2 === 0 ? 'read' : 'write',
        value: i * 100,
      }));

      let currentValue = record.value;
      mockClient.from().select().eq().single.mockImplementation(() => ({
        data: { ...record, value: currentValue },
        error: null,
      }));

      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockImplementation(async () => {
              currentValue += 100;
              return {
                data: { ...record, value: currentValue },
                error: null,
              };
            }),
          }),
        }),
      });

      // Act
      const results = await Promise.all(
        operations.map(op => 
          op.type === 'read' 
            ? repository.findById(record.id)
            : repository.update(record.id, { value: op.value })
        )
      );

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      const finalRead = await repository.findById(record.id);
      expect(finalRead.data?.value).toBe(currentValue);
    });
  });

  describe('Deadlock Prevention', () => {
    it('should handle deadlock scenarios with retries', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const [record1, record2] = mockData;

      mockClient.from().select().eq().single
        .mockRejectedValueOnce(mockErrors.deadlockDetected)
        .mockResolvedValueOnce({ data: record1, error: null })
        .mockResolvedValueOnce({ data: record2, error: null });

      // Act
      const results = await Promise.all([
        transactionManager.transaction(async () => {
          await repository.update(record1.id, { value: 100 });
          return repository.update(record2.id, { value: 200 });
        }),
        transactionManager.transaction(async () => {
          await repository.update(record2.id, { value: 300 });
          return repository.update(record1.id, { value: 400 });
        }),
      ]);

      // Assert
      expect(results.some(r => r.error?.code === 'DEADLOCK_DETECTED')).toBe(true);
      expect(results.filter(r => !r.error)).toHaveLength(1);
    });
  });
}); 
/**
 * Database Performance Benchmarks
 * Last Updated: 2024-03-19 18:10 PST
 * 
 * This file contains performance benchmarks for database operations,
 * measuring throughput, latency, and scalability under various conditions.
 */

import { BaseRepository } from '../../base/repository';
import { DatabaseRecord } from '../../base/types';
import { TransactionManager } from '../../base/transaction';
import {
  TestRecord,
  createMockSupabaseClient,
  createMockData,
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

/**
 * Benchmark utilities
 */
const benchmarkUtils = {
  /**
   * Measure execution time of an operation
   */
  async measureTime<T>(
    operation: () => Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /**
   * Run multiple iterations of an operation
   */
  async runIterations<T>(
    operation: () => Promise<T>,
    iterations: number
  ): Promise<{ results: T[]; durations: number[]; average: number }> {
    const durations: number[] = [];
    const results: T[] = [];

    for (let i = 0; i < iterations; i++) {
      const { result, duration } = await benchmarkUtils.measureTime(operation);
      results.push(result);
      durations.push(duration);
    }

    const average = durations.reduce((a, b) => a + b, 0) / iterations;
    return { results, durations, average };
  },
};

describe('Performance Benchmarks', () => {
  let repository: TestRepository;
  let transactionManager: TransactionManager;
  let mockData: TestRecord[];

  beforeEach(() => {
    repository = new TestRepository();
    transactionManager = new TransactionManager(repository['supabase']);
    mockData = createMockData(100); // Create more test data for benchmarks
  });

  describe('Read Operations', () => {
    it('should measure single record retrieval performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      mockClient.from().select().eq().single.mockResolvedValue({
        data: record,
        error: null,
      });

      // Act
      const { results, average } = await benchmarkUtils.runIterations(
        () => repository.findById(record.id),
        100
      );

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(average).toBeLessThan(50); // Should complete within 50ms
    });

    it('should measure bulk read performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      // Act
      const { results, average } = await benchmarkUtils.runIterations(
        () => repository.findMany({ limit: 50 }),
        20
      );

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(average).toBeLessThan(100); // Should complete within 100ms
    });
  });

  describe('Write Operations', () => {
    it('should measure single record update performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const record = mockData[0];
      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: record,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const { results, average } = await benchmarkUtils.runIterations(
        () => repository.update(record.id, { value: Math.random() }),
        50
      );

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(average).toBeLessThan(75); // Should complete within 75ms
    });

    it('should measure transaction performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.rpc.mockResolvedValue({ data: null, error: null });

      // Act
      const { results, average } = await benchmarkUtils.runIterations(
        () => transactionManager.transaction(async () => {
          const results = [];
          for (let i = 0; i < 5; i++) {
            const result = await repository.update(
              mockData[i].id,
              { value: Math.random() }
            );
            results.push(result);
          }
          return results;
        }),
        10
      );

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(average).toBeLessThan(200); // Should complete within 200ms
    });
  });

  describe('Concurrent Operations', () => {
    it('should measure concurrent read performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockData[0],
        error: null,
      });

      // Act
      const start = performance.now();
      const results = await Promise.all(
        Array(20).fill(null).map(() => repository.findById('test-1'))
      );
      const duration = performance.now() - start;

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(duration).toBeLessThan(100); // All operations should complete within 100ms
    });

    it('should measure concurrent write performance', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockData[0],
              error: null,
            }),
          }),
        }),
      });

      // Act
      const start = performance.now();
      const results = await Promise.all(
        Array(10).fill(null).map((_, i) => 
          repository.update(`test-${i}`, { value: Math.random() })
        )
      );
      const duration = performance.now() - start;

      // Assert
      expect(results.every(r => !r.error)).toBe(true);
      expect(duration).toBeLessThan(150); // All operations should complete within 150ms
    });
  });
}); 
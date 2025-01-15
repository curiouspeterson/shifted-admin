/**
 * Base Repository Tests
 * Last Updated: 2024-03-19 17:40 PST
 * 
 * This file contains unit tests for the base repository implementation.
 */

import { BaseRepository } from '../../base/repository';
import { DatabaseResult, DatabaseRecord } from '../../base/types';
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

describe('BaseRepository', () => {
  let repository: TestRepository;
  let mockData: TestRecord[];

  beforeEach(() => {
    repository = new TestRepository();
    mockData = createMockData(3);
  });

  describe('findById', () => {
    it('should return a record when found', async () => {
      // Arrange
      const mockRecord = mockData[0];
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().select().eq().single.mockResolvedValue({
        data: mockRecord,
        error: null,
      });

      // Act
      const result = await repository.findById(mockRecord.id);

      // Assert
      expect(result.data).toEqual(mockRecord);
      expect(result.error).toBeNull();
      expect(mockClient.from).toHaveBeenCalledWith('test_table');
      expect(mockClient.from().select().eq().single).toHaveBeenCalled();
    });

    it('should handle not found error', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().select().eq().single.mockResolvedValue({
        data: null,
        error: mockErrors.notFound,
      });

      // Act
      const result = await repository.findById('non-existent');

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('NOT_FOUND');
    });

    it('should retry on transient errors', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const mockRecord = mockData[0];
      const mockSingle = mockClient.from().select().eq().single;

      // First call fails with serialization error, second succeeds
      mockSingle
        .mockRejectedValueOnce(mockErrors.serializationFailure)
        .mockResolvedValueOnce({
          data: mockRecord,
          error: null,
        });

      // Act
      const result = await repository.findById(mockRecord.id);

      // Assert
      expect(result.data).toEqual(mockRecord);
      await testUtils.assertRetry(mockSingle, 2);
    });
  });

  describe('findMany', () => {
    it('should return multiple records', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().select.mockResolvedValue({
        data: mockData,
        error: null,
      });

      // Act
      const result = await repository.findMany();

      // Assert
      expect(result.data).toEqual(mockData);
      expect(result.error).toBeNull();
      expect(mockClient.from).toHaveBeenCalledWith('test_table');
    });

    it('should apply filters correctly', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const filters = {
        isActive: true,
        limit: 2,
        orderBy: 'name',
        orderDirection: 'desc' as const,
      };

      mockClient.from().select.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockData.slice(0, 2),
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await repository.findMany(filters);

      // Assert
      expect(result.data).toHaveLength(2);
      expect(mockClient.from().select().eq).toHaveBeenCalledWith('isActive', true);
    });
  });

  describe('create', () => {
    it('should create a new record', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const newRecord = {
        name: 'New Record',
        value: 42,
        isActive: true,
      };

      mockClient.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { ...newRecord, id: 'new-id', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
            error: null,
          }),
        }),
      });

      // Act
      const result = await repository.create(newRecord);

      // Assert
      expect(result.data).toBeDefined();
      expect(result.data?.name).toBe(newRecord.name);
      expect(result.error).toBeNull();
    });

    it('should handle unique constraint violations', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().insert.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(mockErrors.uniqueViolation),
        }),
      });

      // Act
      const result = await repository.create({ name: 'Duplicate', value: 1, isActive: true });

      // Assert
      expect(result.data).toBeNull();
      expect(result.error?.code).toBe('DUPLICATE');
    });
  });

  describe('update', () => {
    it('should update an existing record', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      const mockRecord = mockData[0];
      const updateData = { name: 'Updated Name' };

      mockClient.from().update.mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { ...mockRecord, ...updateData },
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await repository.update(mockRecord.id, updateData);

      // Assert
      expect(result.data?.name).toBe(updateData.name);
      expect(result.error).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a record', async () => {
      // Arrange
      const mockClient = repository['supabase'] as jest.Mocked<any>;
      mockClient.from().delete.mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Act
      const result = await repository.delete('test-id');

      // Assert
      expect(result.error).toBeNull();
      expect(mockClient.from().delete().eq).toHaveBeenCalledWith('id', 'test-id');
    });
  });
}); 
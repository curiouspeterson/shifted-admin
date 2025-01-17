/**
 * OfflineShiftList Component Tests
 * Last Updated: 2024-01-15
 * 
 * Tests the offline-capable shift list component, including:
 * - Loading states
 * - Offline data display
 * - Sync status indicators
 * - Error states
 */

import { render, screen, act, fireEvent } from '@testing-library/react'
import OfflineShiftList from '@/components/shifts/OfflineShiftList'
import { useOfflineData } from '@/hooks/use-offline-data'
import { useOfflineFallback } from '@/hooks/use-offline-fallback'
import { type Shift } from '@/lib/schemas/base/shift'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Mock the hooks
jest.mock('@/hooks/useOfflineData')
jest.mock('@/hooks/useOfflineFallback')

describe('OfflineShiftList', () => {
  const now = new Date().toISOString()
  const mockShifts: Shift[] = [
    {
      id: '1',
      name: 'Morning Shift',
      start_time: '09:00',
      end_time: '17:00',
      is_active: true,
      requires_supervisor: false,
      min_dispatchers: 2,
      created_at: now,
      updated_at: now,
      created_by: '00000000-0000-0000-0000-000000000000',
      updated_by: '00000000-0000-0000-0000-000000000000'
    },
    {
      id: '2',
      name: 'Evening Shift',
      start_time: '10:00',
      end_time: '18:00',
      is_active: true,
      requires_supervisor: true,
      min_dispatchers: 3,
      created_at: now,
      updated_at: now,
      created_by: '00000000-0000-0000-0000-000000000000',
      updated_by: '00000000-0000-0000-0000-000000000000'
    }
  ]

  // Type the mock functions
  const mockSaveData = jest.fn().mockImplementation(async (data: unknown) => {}) as jest.MockedFunction<(data: unknown) => Promise<void>>
  const mockSyncData = jest.fn().mockImplementation(async () => {}) as jest.MockedFunction<() => Promise<void>>
  const mockRefresh = jest.fn().mockImplementation(async () => {}) as jest.MockedFunction<() => Promise<void>>
  const mockRetry = jest.fn().mockImplementation(async () => {}) as jest.MockedFunction<() => Promise<void>>

  beforeEach(() => {
    jest.resetAllMocks()
    
    // Default offline fallback mock
    jest.mocked(useOfflineFallback).mockReturnValue({
      isOnline: true,
      isChecking: false,
      retryCount: 0,
      lastOnline: Date.now(),
      retry: mockRetry,
      canRetry: true
    })
  })

  it('should show loading state', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isSyncing: false,
      lastSynced: null,
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    render(<OfflineShiftList storeId="store1" />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display shifts from offline storage', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    render(<OfflineShiftList storeId="store1" />)
    
    expect(screen.getByText('Morning Shift')).toBeInTheDocument()
    expect(screen.getByText('Evening Shift')).toBeInTheDocument()
    expect(screen.getByText(/supervisor required/i)).toBeInTheDocument()
  })

  it('should show sync status', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: true,
      lastSynced: Date.now(),
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    render(<OfflineShiftList storeId="store1" />)
    expect(screen.getByText(/syncing changes/i)).toBeInTheDocument()
  })

  it('should show last synced time', () => {
    const lastSynced = Date.now()
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced,
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    render(<OfflineShiftList storeId="store1" />)
    expect(screen.getByText(/last synced/i)).toBeInTheDocument()
    expect(screen.getByText(new Date(lastSynced).toLocaleTimeString())).toBeInTheDocument()
  })

  it('should handle errors', () => {
    const error = new Error('Failed to load shifts')
    jest.mocked(useOfflineData).mockReturnValue({
      data: null,
      isLoading: false,
      error,
      isSyncing: false,
      lastSynced: null,
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    render(<OfflineShiftList storeId="store1" />)
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    expect(screen.getByText(error.message)).toBeInTheDocument()
  })

  it('should handle empty state', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    jest.mocked(useOfflineFallback).mockReturnValue({
      isOnline: false,
      isChecking: false,
      retryCount: 0,
      lastOnline: Date.now(),
      retry: mockRetry,
      canRetry: false
    })

    render(<OfflineShiftList storeId="store1" />)
    expect(screen.getByText(/no shifts found/i)).toBeInTheDocument()
    expect(screen.getByText(/you're offline/i)).toBeInTheDocument()
  })

  it('should handle retry when offline', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: mockSaveData,
      syncData: mockSyncData,
      refresh: mockRefresh
    })

    jest.mocked(useOfflineFallback).mockReturnValue({
      isOnline: false,
      isChecking: false,
      retryCount: 1,
      lastOnline: Date.now() - 60000, // 1 minute ago
      retry: mockRetry,
      canRetry: true
    })

    render(<OfflineShiftList storeId="store1" />)
    
    const retryButton = screen.getByText(/click to retry/i)
    fireEvent.click(retryButton)
    
    expect(mockRetry).toHaveBeenCalled()
  })
}) 
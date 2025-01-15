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
import { OfflineShiftList } from '@/components/shifts/OfflineShiftList'
import { useOfflineData } from '@/hooks/useOfflineData'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import '@testing-library/jest-dom'

// Mock the useOfflineData hook
jest.mock('@/hooks/useOfflineData')

describe('OfflineShiftList', () => {
  const mockShifts = [
    { id: '1', date: '2024-01-15', startTime: '09:00', endTime: '17:00', employeeId: 'emp1' },
    { id: '2', date: '2024-01-16', startTime: '10:00', endTime: '18:00', employeeId: 'emp2' }
  ]

  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks()
  })

  it('should show loading state', () => {
    // Mock loading state
    jest.mocked(useOfflineData).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isSyncing: false,
      lastSynced: null,
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
  })

  it('should display shifts from offline storage', () => {
    // Mock successful data load
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    
    // Check if shifts are displayed
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('9:00 AM - 5:00 PM')).toBeInTheDocument()
    expect(screen.getByText('Jan 16, 2024')).toBeInTheDocument()
    expect(screen.getByText('10:00 AM - 6:00 PM')).toBeInTheDocument()
  })

  it('should show sync status', () => {
    // Mock syncing state
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: true,
      lastSynced: Date.now(),
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    expect(screen.getByText(/syncing/i)).toBeInTheDocument()
  })

  it('should show last synced time', () => {
    const lastSynced = Date.now()
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced,
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
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
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    expect(screen.getByText(/failed to load shifts/i)).toBeInTheDocument()
  })

  it('should trigger sync on refresh button click', () => {
    const syncData = jest.fn()
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: jest.fn(),
      syncData,
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    
    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    fireEvent.click(refreshButton)
    
    expect(syncData).toHaveBeenCalled()
  })

  it('should handle empty state', () => {
    jest.mocked(useOfflineData).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced: Date.now(),
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    expect(screen.getByText(/no shifts found/i)).toBeInTheDocument()
  })

  it('should show stale data warning when offline', () => {
    const lastSynced = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
    jest.mocked(useOfflineData).mockReturnValue({
      data: mockShifts,
      isLoading: false,
      error: null,
      isSyncing: false,
      lastSynced,
      saveData: jest.fn(),
      syncData: jest.fn(),
      refresh: jest.fn()
    })

    render(<OfflineShiftList />)
    expect(screen.getByText(/data may be out of date/i)).toBeInTheDocument()
  })
}) 
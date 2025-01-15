/**
 * OfflineIndicator Component Tests
 * Last Updated: 2024-01-15
 */

import { render, screen, act } from '@testing-library/react'
import { OfflineIndicator } from '@/components/ui/OfflineIndicator'
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import '@testing-library/jest-dom'

describe('OfflineIndicator', () => {
  // Mock window.navigator.onLine
  const mockNavigatorOnLine = (online: boolean) => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: online
    })
  }

  beforeEach(() => {
    // Reset to online state
    mockNavigatorOnLine(true)
  })

  afterEach(() => {
    // Clean up event listeners
    window.dispatchEvent(new Event('online'))
  })

  it('should not show offline indicator when online', () => {
    render(<OfflineIndicator isOnline={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.queryByText(/offline/i)).not.toBeInTheDocument()
  })

  it('should show offline indicator when offline', () => {
    render(<OfflineIndicator isOnline={false} />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
  })

  it('should show checking state', () => {
    render(<OfflineIndicator isOnline={false} isChecking={true} />)
    expect(screen.getByText(/checking connection/i)).toBeInTheDocument()
  })

  it('should show last online time', () => {
    const lastOnline = Date.now()
    render(<OfflineIndicator isOnline={false} lastOnline={lastOnline} />)
    expect(screen.getByText(/last online/i)).toBeInTheDocument()
  })

  it('should call onRetry when retry button clicked', () => {
    const onRetry = jest.fn()
    render(<OfflineIndicator isOnline={false} onRetry={onRetry} />)
    
    const retryButton = screen.getByText(/click to retry/i)
    retryButton.click()
    
    expect(onRetry).toHaveBeenCalled()
  })

  it('should show retry button as disabled when no onRetry provided', () => {
    render(<OfflineIndicator isOnline={false} />)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('should update when connection status changes', () => {
    const { rerender } = render(<OfflineIndicator isOnline={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
    
    rerender(<OfflineIndicator isOnline={false} />)
    expect(screen.getByText(/offline/i)).toBeInTheDocument()
    
    rerender(<OfflineIndicator isOnline={true} />)
    expect(screen.getByText('Online')).toBeInTheDocument()
  })
}) 
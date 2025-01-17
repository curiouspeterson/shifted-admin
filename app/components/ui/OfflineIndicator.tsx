/**
 * Offline Indicator Component
 * Last Updated: 2025-01-16
 * 
 * A component that displays the current online/offline status with retry functionality.
 */

import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'

interface OfflineIndicatorProps {
  isOnline: boolean
  isChecking?: boolean
  lastOnline?: Date | null
  onRetry?: () => void
  className?: string
}

export function OfflineIndicator({
  isOnline,
  isChecking,
  lastOnline,
  onRetry,
  className
}: OfflineIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-500" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-500" />
      )}
      
      <span className={cn(
        'text-sm',
        isOnline ? 'text-green-700' : 'text-red-700'
      )}>
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {!isOnline && onRetry && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          disabled={isChecking}
          className="ml-2"
        >
          <RefreshCw className={cn(
            'h-3 w-3 mr-1',
            isChecking && 'animate-spin'
          )} />
          Retry
        </Button>
      )}

      {lastOnline && !isOnline && (
        <span className="text-xs text-gray-500 ml-2">
          Last online: {lastOnline.toLocaleTimeString()}
        </span>
      )}
    </div>
  )
} 
/**
 * Offline Indicator Component
 * Last Updated: 2024-03-20
 * 
 * This component displays the current connection status and
 * provides a way to retry the connection.
 */

'use client'

interface OfflineIndicatorProps {
  isOnline: boolean
  isChecking?: boolean
  lastOnline?: number | null
  onRetry?: () => void
}

export function OfflineIndicator({
  isOnline,
  isChecking = false,
  lastOnline,
  onRetry
}: OfflineIndicatorProps) {
  if (isOnline) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
        <span className="w-2 h-2 mr-2 rounded-full bg-green-500" />
        Online
        {lastOnline && (
          <span className="ml-2 text-xs text-green-600">
            Connected since {new Date(lastOnline).toLocaleTimeString()}
          </span>
        )}
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
        <span className="w-2 h-2 mr-2 rounded-full bg-blue-500 animate-pulse" />
        Checking Connection...
      </div>
    )
  }

  return (
    <button
      onClick={onRetry}
      disabled={!onRetry}
      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <span className="w-2 h-2 mr-2 rounded-full bg-yellow-500 animate-pulse" />
      Offline - {onRetry ? 'Click to Retry' : 'Retrying...'}
      {lastOnline && (
        <span className="ml-2 text-xs text-yellow-600">
          Last online: {new Date(lastOnline).toLocaleTimeString()}
        </span>
      )}
    </button>
  )
} 
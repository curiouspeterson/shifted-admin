/**
 * Loading Spinner Component
 * Last Updated: 2024-03-20
 * 
 * This component provides a loading indicator with an optional label.
 */

interface LoadingSpinnerProps {
  label?: string
}

export function LoadingSpinner({ label = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      {label && (
        <div className="mt-2 text-sm text-gray-500">{label}</div>
      )}
    </div>
  )
} 
/**
 * Shift List Component
 * Last Updated: 2024-03-20
 * 
 * This component displays a list of shifts with offline support
 * and retry functionality.
 */

'use client'

interface Shift {
  id: string
  startDate: string
  endDate: string
  requirements: string[]
  status: 'pending' | 'approved' | 'rejected'
}

interface ShiftListProps {
  shifts: Shift[]
  isOffline: boolean
  onRetry: () => void
}

export function ShiftList({ shifts, isOffline, onRetry }: ShiftListProps) {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requirements
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shifts.map((shift) => (
              <tr key={shift.id} className={isOffline ? 'opacity-75' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(shift.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(shift.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex flex-wrap gap-2">
                    {shift.requirements.map((req) => (
                      <span
                        key={req}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${shift.status === 'approved' ? 'bg-green-100 text-green-800' :
                      shift.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'}`}
                  >
                    {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                  </span>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                  No shifts found
                  {isOffline && (
                    <button
                      onClick={onRetry}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      Retry
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
} 
/**
 * Shift List Component
 * Last Updated: 2024-03-21
 * 
 * A component that displays a list of shifts with offline support.
 */

'use client';

import { Spinner } from '@/components/ui/spinner';

interface Shift {
  id: string;
  startDate: string;
  endDate: string;
  requirements: string[];
  status: 'pending' | 'approved' | 'rejected';
}

interface ShiftListProps {
  shifts: Shift[];
  isOffline: boolean;
  isLoading: boolean;
}

export function ShiftList({ shifts, isOffline, isLoading }: ShiftListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner />
      </div>
    );
  }

  if (!shifts.length) {
    return (
      <div className="text-center p-8 text-gray-500">
        <p>No shifts found</p>
        {isOffline && (
          <p className="mt-2 text-sm">
            You&apos;re offline. Some data may not be available.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="divide-y divide-gray-200">
        {shifts.map((shift) => (
          <div
            key={shift.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between">
              <div>
                <h3 className="font-medium">Shift {shift.id}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(shift.startDate).toLocaleString()} - 
                  {new Date(shift.endDate).toLocaleString()}
                </p>
              </div>
              <div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  shift.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : shift.status === 'rejected'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
                </span>
              </div>
            </div>
            {shift.requirements.length > 0 && (
              <div className="mt-2">
                <h4 className="text-sm font-medium text-gray-700">Requirements:</h4>
                <ul className="mt-1 text-sm text-gray-600">
                  {shift.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 
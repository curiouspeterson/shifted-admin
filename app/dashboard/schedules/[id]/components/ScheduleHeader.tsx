'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Schedule } from '@/app/types/scheduling';

interface ScheduleHeaderProps {
  schedule: Schedule;
}

export default function ScheduleHeader({ schedule }: ScheduleHeaderProps) {
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleApprove = async (scheduleId: string) => {
    try {
      setIsApproving(true);
      setError(null);

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve schedule');
      }

      // Refresh the page to show updated status
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve schedule');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      setIsDeleting(true);
      setError(null);

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete schedule');
      }

      // Redirect to schedules list
      router.push('/dashboard/schedules');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Schedule Details
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            View and manage schedule details and assignments
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex gap-3">
          <Link
            href={`/dashboard/schedules/edit/${schedule.id}`}
            className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Edit Schedule
          </Link>
          <button
            onClick={() => handleApprove(schedule.id)}
            disabled={isApproving || schedule.status === 'published'}
            className="block rounded-md bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApproving ? 'Publishing...' : 'Publish Schedule'}
          </button>
          <button
            onClick={() => handleDelete(schedule.id)}
            disabled={isDeleting}
            className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete Schedule'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
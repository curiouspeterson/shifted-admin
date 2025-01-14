/**
 * Schedule List Component
 * Last Updated: 2024
 * 
 * This component displays a list of schedules with their details.
 * It includes:
 * - Schedule cards with basic information
 * - Status badges
 * - Links to schedule details
 * - Action buttons for publishing/unpublishing
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { publishSchedule, unpublishSchedule, type Schedule } from '@/lib/actions/schedule';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface ScheduleListProps {
  schedules: Schedule[];
}

export function ScheduleList({ schedules }: ScheduleListProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handlePublish = async (id: string) => {
    try {
      await publishSchedule(id);
      router.refresh();
    } catch (error) {
      console.error('Failed to publish schedule:', error);
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await unpublishSchedule(id);
      router.refresh();
    } catch (error) {
      console.error('Failed to unpublish schedule:', error);
    }
  };

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">
                      {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                    </h3>
                    <Badge variant={schedule.status === 'published' ? 'success' : schedule.status === 'draft' ? 'secondary' : 'destructive'}>
                      {schedule.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Created {new Date(schedule.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {schedule.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTransition(() => handlePublish(schedule.id))}
                    disabled={isPending}
                  >
                    Publish
                  </Button>
                )}
                {schedule.status === 'published' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => startTransition(() => handleUnpublish(schedule.id))}
                    disabled={isPending}
                  >
                    Unpublish
                  </Button>
                )}
                <Link
                  href={`/dashboard/schedules/${schedule.id}`}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </Link>
              </div>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No schedules found
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 
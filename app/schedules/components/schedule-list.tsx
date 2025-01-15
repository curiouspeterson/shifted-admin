/**
 * Schedule List Component
 * Last Updated: 2025-01-15
 * 
 * This component displays a list of schedules in a table format.
 * It supports sorting, filtering, and pagination.
 */

import { format } from 'date-fns';
import Link from 'next/link';
import { EyeOpenIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { scheduleRepository, type Schedule } from '@/lib/api/repositories';

async function getSchedules() {
  const schedules = await scheduleRepository.findMany();
  return schedules;
}

export async function ScheduleList() {
  const schedules = await getSchedules();

  return (
    <div className="rounded-md border">
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.Head>Name</Table.Head>
            <Table.Head>Status</Table.Head>
            <Table.Head>Start Date</Table.Head>
            <Table.Head>End Date</Table.Head>
            <Table.Head>Created</Table.Head>
            <Table.Head className="text-right">Actions</Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {schedules.map((schedule) => (
            <Table.Row key={schedule.id}>
              <Table.Cell className="font-medium">{schedule.name}</Table.Cell>
              <Table.Cell>
                <ScheduleStatusBadge status={schedule.status} />
              </Table.Cell>
              <Table.Cell>{format(new Date(schedule.start_date), 'PPP')}</Table.Cell>
              <Table.Cell>{format(new Date(schedule.end_date), 'PPP')}</Table.Cell>
              <Table.Cell>{format(new Date(schedule.created_at), 'PPP')}</Table.Cell>
              <Table.Cell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/schedules/${schedule.id}`}>
                      <EyeOpenIcon className="h-4 w-4" />
                      <span className="sr-only">View</span>
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                  >
                    <Link href={`/schedules/${schedule.id}/edit`}>
                      <Pencil1Icon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Link>
                  </Button>
                </div>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}

function ScheduleStatusBadge({ status }: { status: Schedule['status'] }) {
  const variants = {
    draft: 'secondary',
    published: 'success',
    archived: 'destructive',
  } as const;

  return (
    <Badge variant={variants[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
} 
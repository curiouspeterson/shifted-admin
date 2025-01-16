/**
 * Schedule Filters Component
 * Last Updated: 2025-01-15
 * 
 * This component provides filters for schedules, including status and date range.
 */

'use client';

import { useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { ScheduleStatus } from '@/lib/api/repositories';

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
  { label: 'Archived', value: 'archived' },
] as const;

export function ScheduleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);

      // Update search params
      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Update URL without reloading the page
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1 space-y-2">
          <label
            htmlFor="status"
            className="text-sm font-medium text-foreground"
          >
            Status
          </label>
          <Select
            id="status"
            value={searchParams.get('status') ?? ''}
            onValueChange={(value) =>
              updateFilters({ status: value || undefined })
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </div>

        <div className="flex-[2]">
          <DateRangePicker
            from={searchParams.get('startDate') ?? undefined}
            to={searchParams.get('endDate') ?? undefined}
            onSelect={({ from, to }) =>
              updateFilters({
                startDate: from?.toISOString(),
                endDate: to?.toISOString(),
              })
            }
          />
        </div>
      </div>
    </Card>
  );
} 
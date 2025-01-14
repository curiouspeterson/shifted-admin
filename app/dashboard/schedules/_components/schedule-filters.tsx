/**
 * Schedule Filters Component
 * Last Updated: 2024
 * 
 * This component provides filtering and sorting options for schedules.
 * It includes:
 * - Status filter (draft, published, archived)
 * - Sort options (start date, end date, status, created at)
 * - Sort direction (ascending, descending)
 */

'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

type Status = '' | 'draft' | 'published' | 'archived';
type SortField = '' | 'start_date' | 'end_date' | 'status' | 'created_at';
type SortOrder = '' | 'asc' | 'desc';

export function ScheduleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Update URL with new search params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams);
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Status Filter */}
      <div className="space-y-2">
        <Label>Status</Label>
        <Select
          value={searchParams.get('status') || ''}
          onValueChange={(value: Status) => {
            router.push(`${pathname}?${createQueryString('status', value)}`);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Field */}
      <div className="space-y-2">
        <Label>Sort by</Label>
        <Select
          value={searchParams.get('sort') || ''}
          onValueChange={(value: SortField) => {
            router.push(`${pathname}?${createQueryString('sort', value)}`);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="start_date">Start Date</SelectItem>
            <SelectItem value="end_date">End Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="created_at">Created At</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sort Direction */}
      <div className="space-y-2">
        <Label>Order</Label>
        <Select
          value={searchParams.get('order') || ''}
          onValueChange={(value: SortOrder) => {
            router.push(`${pathname}?${createQueryString('order', value)}`);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Order" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">Ascending</SelectItem>
            <SelectItem value="desc">Descending</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 
/**
 * Schedule Filters Component
 * Last Updated: 2024-03-21
 * 
 * Client Component for filtering schedules.
 * Uses React Server Actions for state updates.
 */

'use client';

import { useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' }
] as const;

export function ScheduleFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  
  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);
  
  const handleStatusChange = useCallback((value: string) => {
    setStatus(value);
    const params = new URLSearchParams(searchParams);
    
    if (value !== 'all') {
      params.set('status', value);
    } else {
      params.delete('status');
    }
    
    router.push(`?${params.toString()}`);
  }, [router, searchParams]);
  
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <Input
          placeholder="Search schedules..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      
      <Select
        value={status}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button
        variant="outline"
        onClick={() => {
          setSearch('');
          setStatus('all');
          router.push('');
        }}
      >
        Reset filters
      </Button>
    </div>
  );
} 
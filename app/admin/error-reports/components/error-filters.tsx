/**
 * Error Filters Component
 * Last Updated: 2025-01-15
 * 
 * This component provides filtering controls for error reports.
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ErrorSeverity } from '@/lib/logging/error-logger';

export function ErrorFilters() {
  return (
    <Card className="p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search error messages..."
            type="search"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Severity</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="All severities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              <SelectItem value={ErrorSeverity.CRITICAL}>Critical</SelectItem>
              <SelectItem value={ErrorSeverity.ERROR}>Error</SelectItem>
              <SelectItem value={ErrorSeverity.WARN}>Warning</SelectItem>
              <SelectItem value={ErrorSeverity.INFO}>Info</SelectItem>
              <SelectItem value={ErrorSeverity.DEBUG}>Debug</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Time Range</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Last 24 hours" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="ignored">Ignored</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end space-x-2">
        <Button variant="outline" onClick={() => {
          // Implement reset filters
        }}>
          Reset
        </Button>
        <Button onClick={() => {
          // Implement apply filters
        }}>
          Apply Filters
        </Button>
      </div>
    </Card>
  );
} 
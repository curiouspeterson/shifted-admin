/**
 * Schedule Page Loading Components
 * Last Updated: 2024-03-21
 * 
 * Collection of loading skeleton components for the schedule page.
 * Uses Tailwind CSS for styling and animations.
 */

'use client';

import { memo } from 'react';

export const HeaderLoader = memo(function HeaderLoader() {
  return (
    <div className="h-24 bg-gray-100 animate-pulse rounded-lg" />
  );
});

export const TimelineLoader = memo(function TimelineLoader() {
  return (
    <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />
  );
});

export const RequirementsLoader = memo(function RequirementsLoader() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 bg-gray-100 animate-pulse rounded-lg" />
      ))}
    </div>
  );
}); 
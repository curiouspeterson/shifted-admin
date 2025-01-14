/**
 * Skeleton Component
 * Last Updated: 2024
 * 
 * A reusable skeleton component for loading states.
 * Based on shadcn/ui's skeleton component with custom styling.
 */

import { cn } from '@/lib/utils';

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  );
}

export { Skeleton }; 
/**
 * Page Header Component
 * Last Updated: 2025-01-15
 * 
 * This component provides a consistent header for pages with an optional action button.
 */

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export function PageHeader({
  title,
  description,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 md:flex-row md:items-center md:justify-between',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-lg text-muted-foreground">{description}</p>
        )}
      </div>
      {action && (
        <Button asChild className="md:ml-auto">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      )}
    </div>
  );
} 
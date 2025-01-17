'use client';

/**
 * Modal Component
 * Last Updated: 2024-01-16
 * 
 * A reusable modal dialog component built on top of our Dialog component.
 * Features:
 * - Configurable placement
 * - Backdrop overlay
 * - Consistent sizing
 * - Standardized header styling
 * - Flexible content area
 * - Accessibility support
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type ModalPlacement = 'center' | 'top' | 'bottom';

/**
 * Modal Props Interface
 */
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  placement?: ModalPlacement;
}

const placementStyles: Record<ModalPlacement, string> = {
  center: 'sm:my-16',
  top: 'sm:mt-16',
  bottom: 'sm:mb-16 sm:mt-auto',
};

/**
 * Modal Component
 * A standardized modal dialog component
 */
export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
  placement = 'center',
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          placementStyles[placement],
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
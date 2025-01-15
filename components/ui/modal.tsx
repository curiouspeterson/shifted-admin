'use client';

/**
 * Modal Component
 * Last Updated: 2024-03
 * 
 * A reusable modal dialog component built on top of our Dialog component.
 * Features:
 * - Centered placement
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

/**
 * Modal Props Interface
 */
interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

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
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
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
/**
 * Modal Component
 * Last Updated: 2025-01-17
 * 
 * A modern modal component that integrates with Next.js App Router.
 * Features:
 * - Configurable placement
 * - Backdrop overlay with blur effect
 * - Consistent sizing and animations
 * - Standardized header styling
 * - Keyboard navigation and focus management
 * - Full accessibility support
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ModalPlacement = 'center' | 'top' | 'bottom'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: React.ReactNode
  className?: string
  placement?: ModalPlacement
  showCloseButton?: boolean
}

const placementStyles: Record<ModalPlacement, string> = {
  center: 'sm:my-16',
  top: 'sm:mt-16',
  bottom: 'sm:mb-16 sm:mt-auto',
}

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  className,
  placement = 'center',
  showCloseButton = true,
}: ModalProps) {
  // Handle escape key press
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          'relative',
          placementStyles[placement],
          className
        )}
      >
        <DialogHeader className="space-y-2">
          <DialogTitle>{title}</DialogTitle>
          {showCloseButton && (
            <DialogClose asChild>
              <Button
                type="button"
                variant="ghost"
                className="absolute right-4 top-4 h-6 w-6 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
              >
                <span className="sr-only">Close</span>
                ✕
              </Button>
            </DialogClose>
          )}
        </DialogHeader>
        <div className="py-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
} 
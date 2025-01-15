'use client';

/**
 * Test Modal Component
 * Last Updated: 2024-03
 * 
 * A demonstration component showcasing the implementation of dialog/modal
 * functionality using our base UI components.
 * 
 * Features:
 * - Modal trigger button
 * - Centered placement
 * - Header, body, and footer sections
 * - Text input field
 * - Action buttons
 * - Accessibility support
 */

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Test Modal Component
 * Demonstrates modal functionality using our base UI components
 */
export function TestModal() {
  return (
    <Dialog>
      {/* Modal Trigger Button */}
      <DialogTrigger asChild>
        <Button>Open Modal</Button>
      </DialogTrigger>

      {/* Modal Content */}
      <DialogContent>
        {/* Modal Header */}
        <DialogHeader>
          <DialogTitle>Test Modal</DialogTitle>
        </DialogHeader>

        {/* Modal Body with Example Content */}
        <div className="space-y-4">
          <p>This is a test modal using our base UI components.</p>
          <Input
            type="text"
            placeholder="Try typing here"
          />
        </div>

        {/* Modal Footer with Action Buttons */}
        <DialogFooter>
          <Button variant="outline">
            Close
          </Button>
          <Button>
            Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 
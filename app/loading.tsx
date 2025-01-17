/**
 * Root Loading Page
 * Last Updated: 2024-03-21
 * 
 * Global loading page for the application.
 * Uses the Spinner component for loading indication.
 */

import { Spinner } from '@/components/ui/spinner';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Spinner size="lg" />
    </div>
  );
} 
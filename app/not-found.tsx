/**
 * Not Found Page
 * Last Updated: 2025-01-16
 * 
 * 404 page component
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-bold tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold tracking-tight">
          Page Not Found
        </h2>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      
      <div className="flex gap-2">
        <Link href="/">
          <Button variant="default">
            Return Home
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </div>
    </div>
  );
} 
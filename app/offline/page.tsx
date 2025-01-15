'use client';

import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <WifiOff className="h-16 w-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">You're Offline</h1>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        {isOnline
          ? "You're back online! Click below to reload the app."
          : "Please check your internet connection and try again."}
      </p>
      <Button
        onClick={handleRetry}
        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary/90"
      >
        {isOnline ? 'Reload App' : 'Try Again'}
      </Button>
    </div>
  );
} 
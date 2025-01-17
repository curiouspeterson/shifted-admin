/**
 * Root Layout
 * Last Updated: 2025-01-17
 * 
 * Root layout component for the application
 */

import { type Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toast';
import { SyncProvider } from '@/components/sync/sync-provider';
import { SyncIndicator } from '@/components/sync/sync-indicator';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shifted Admin',
  description: 'Admin dashboard for Shifted',
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SyncProvider>
          <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container flex h-14 items-center">
                <div className="mr-4 flex">
                  <Link 
                    href="/" 
                    className="mr-6 flex items-center space-x-2"
                  >
                    <span className="font-bold">Shifted Admin</span>
                  </Link>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                  <SyncIndicator />
                </div>
              </div>
            </header>

            <main className="container py-6">
              {children}
            </main>
          </div>
          <Toaster />
        </SyncProvider>
      </body>
    </html>
  );
}

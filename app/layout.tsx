/**
 * Root Layout
 * Last Updated: January 15, 2024
 * 
 * This is the root layout component that wraps all pages.
 * It includes metadata configuration, font loading, and global providers.
 */

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from './providers';
import './globals.css';

// Initialize font
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Metadata configuration
export const metadata: Metadata = {
  title: {
    default: '24/7 Dispatch Center',
    template: '%s | 24/7 Dispatch Center'
  },
  description: 'Scheduling application for 24/7 dispatch center operations',
  applicationName: '24/7 Dispatch Center',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '24/7 Dispatch Center',
  },
  formatDetection: {
    telephone: false,
  },
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          {children}
          <Toaster richColors closeButton position="top-right" />
        </Providers>
      </body>
    </html>
  );
}

/**
 * Root Layout Component
 * Last Updated: 2024-03-20
 * 
 * This is the root layout component that wraps all pages.
 * It provides:
 * - Global providers (error handling, theme, auth, query)
 * - Global styles
 * - Metadata configuration
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Shifted Admin',
  description: 'Admin dashboard for managing shifts and employees',
  viewport: 'width=device-width, initial-scale=1',
  robots: 'noindex, nofollow', // Prevent indexing of admin dashboard
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

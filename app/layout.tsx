import './globals.css';
import { Providers } from './lib/providers/providers';

export const metadata = {
  title: 'Shifted Admin',
  description: 'Admin portal for Shifted',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground">
        <Providers>
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

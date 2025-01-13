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
    <html lang="en" className="h-full bg-gray-100">
      <body className="h-full">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

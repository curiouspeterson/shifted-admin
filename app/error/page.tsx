/**
 * Global Error Page Module
 * Last Updated: 2024
 * 
 * Server component that provides a user-friendly error page when unhandled 
 * errors occur in the application. Displays a simple message and return home link.
 * 
 * Features:
 * - Responsive, centered layout
 * - Clear error messaging
 * - Easy navigation back to home
 * - Accessible text and controls
 * - Consistent styling with app theme
 * 
 * Route: Rendered automatically by Next.js when errors occur
 */

import Link from 'next/link';

/**
 * Error Page Component
 * Provides a fallback UI when unhandled errors occur in the application
 * 
 * @component
 * @returns React server component for error display
 * 
 * @example
 * ```tsx
 * // Rendered automatically by Next.js when an error occurs
 * <ErrorPage />
 * ```
 * 
 * Note: This is a server component since it doesn't require client-side 
 * interactivity beyond the Link component navigation.
 */
export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-xl p-8 text-center">
        <h1 className="mb-4 text-4xl font-bold">Oops!</h1>
        <p className="mb-8 text-lg text-gray-600">
          Something went wrong. We&apos;re sorry for the inconvenience.
        </p>
        <p className="mb-8 text-gray-600">
          Please try again or contact support if the problem persists.
        </p>
        <Link
          href="/"
          className="inline-block bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
} 
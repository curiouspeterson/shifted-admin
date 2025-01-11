import Link from 'next/link';

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
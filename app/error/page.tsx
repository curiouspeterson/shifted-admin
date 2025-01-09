export default function ErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We're having trouble loading the application. Please try:
          </p>
          <ul className="mt-4 text-sm text-gray-600 list-disc list-inside">
            <li>Refreshing the page</li>
            <li>Clearing your browser cookies</li>
            <li>Checking your internet connection</li>
          </ul>
          <div className="mt-6 text-center">
            <a
              href="/"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Return to home page
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 
/**
 * Fetcher Module
 * Last Updated: 2024
 * 
 * Provides a generic fetcher function for use with SWR (stale-while-revalidate)
 * data fetching. Handles API requests and error responses in a consistent manner
 * across the application.
 * 
 * Features:
 * - Type-safe response handling
 * - Consistent error formatting
 * - Support for custom request options
 * - JSON response parsing
 */

/**
 * Generic fetcher function for SWR
 * Makes HTTP requests and handles responses, throwing enhanced errors for non-200 responses
 * 
 * @template JSON - The expected response data type
 * @param input - Request URL or Request object
 * @param init - Optional request configuration
 * @returns Promise resolving to the parsed JSON response
 * @throws Enhanced Error object with status and response data for non-200 responses
 */
export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  
  // Handle non-200 responses
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Enhance error with response details
    const errorData = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }

  // Parse and return successful response
  return res.json();
} 
/**
 * Generic fetcher function for SWR
 * Handles API requests and error responses
 */
export async function fetcher<JSON = any>(
  input: RequestInfo,
  init?: RequestInit
): Promise<JSON> {
  const res = await fetch(input, init);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Add extra info to the error object
    const errorData = await res.json().catch(() => ({}));
    (error as any).status = res.status;
    (error as any).info = errorData;
    throw error;
  }

  return res.json();
} 
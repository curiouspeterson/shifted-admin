/**
 * Debug Headers API Route Handler
 * Last Updated: 2024
 * 
 * This file implements a debugging endpoint for inspecting HTTP headers
 * and cookies. It provides detailed information about:
 * - All request headers
 * - All cookies
 * - Size analysis of headers and cookies
 * 
 * This route is useful for debugging authentication issues, cookie problems,
 * and investigating request size limitations.
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * GET /api/debug/headers
 * Analyzes and returns information about request headers and cookies
 * 
 * Returns:
 * - Summary of total sizes
 * - Detailed list of cookies with sizes and truncated values
 * - Detailed list of headers with sizes and truncated values
 */
export async function GET(request: Request) {
  // Get all cookies from the request
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  /**
   * Extract Headers
   * Converts headers from Headers object to plain object
   * for easier processing and serialization
   */
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  /**
   * Calculate Sizes and Create Summaries
   * For both cookies and headers:
   * - Measures the size of each value
   * - Truncates long values for display
   * - Preserves original size information
   */
  const cookieSizes = allCookies.map(cookie => ({
    name: cookie.name,
    size: cookie.value.length,
    value: cookie.value.substring(0, 50) + (cookie.value.length > 50 ? '...' : ''),
  }));

  const headerSizes = Object.entries(headers).map(([name, value]) => ({
    name,
    size: value.length,
    value: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
  }));

  /**
   * Calculate Total Sizes
   * Sums up the total size of all cookies and headers
   * Useful for monitoring request size limits
   */
  const totalCookieSize = cookieSizes.reduce((acc, curr) => acc + curr.size, 0);
  const totalHeaderSize = headerSizes.reduce((acc, curr) => acc + curr.size, 0);

  // Return formatted response with all collected information
  return NextResponse.json({
    summary: {
      totalCookieSize,    // Total size of all cookies
      totalHeaderSize,    // Total size of all headers
      totalSize: totalCookieSize + totalHeaderSize,  // Combined total size
    },
    cookies: cookieSizes, // Detailed cookie information
    headers: headerSizes, // Detailed header information
  });
} 
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  
  // Get all headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Calculate sizes
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

  // Calculate totals
  const totalCookieSize = cookieSizes.reduce((acc, curr) => acc + curr.size, 0);
  const totalHeaderSize = headerSizes.reduce((acc, curr) => acc + curr.size, 0);

  return NextResponse.json({
    summary: {
      totalCookieSize,
      totalHeaderSize,
      totalSize: totalCookieSize + totalHeaderSize,
    },
    cookies: cookieSizes,
    headers: headerSizes,
  });
} 
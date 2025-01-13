import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ message: 'Auth cookies cleared' });
  
  // Clear Supabase auth cookie
  response.cookies.delete('sb-hoipgxehpbnvcioljsmh-auth-token');
  
  return response;
} 
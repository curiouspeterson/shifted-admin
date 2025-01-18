/**
 * Next.js Configuration
 * Last Updated: 2025-01-17
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development
  reactStrictMode: true,
  
  // Enable modern optimizations
  optimizeFonts: true,
  optimizeImages: true,
  
  // TypeScript configuration
  typescript: {
    // Don't ignore build errors
    ignoreBuildErrors: false,
    
    // Enable more strict checking
    strict: true,
    
    // Enable incremental type checking for better performance
    incremental: true,
  },
  
  // Modern features
  experimental: {
    // Enable modern React features
    serverActions: true,
    
    // Enable modern CSS features
    optimizeCss: true,
    
    // Enable modern bundling features
    turbotrace: {
      logLevel: 'error',
    },
  },
  
  // Supabase configuration
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
}

module.exports = nextConfig

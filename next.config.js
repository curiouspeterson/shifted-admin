/**
 * Next.js Configuration
 * Last Updated: 2025-01-17
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    typedRoutes: true,
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
}

module.exports = nextConfig

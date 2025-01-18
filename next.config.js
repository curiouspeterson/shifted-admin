/**
 * Next.js Configuration
 * Last Updated: 2025-01-17
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimization settings
  swcMinify: true,
  poweredByHeader: false,
  reactStrictMode: true,
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },

  // Experimental features
  experimental: {
    // Server actions are enabled by default in Next.js 14
    typedRoutes: true,
    serverComponentsExternalPackages: [],
  },

  // TypeScript settings are now handled by tsconfig.json
  typescript: {
    // These will be checked by the build process
  },

  // Enable source maps in development
  productionBrowserSourceMaps: process.env.NODE_ENV === 'development',
  
  // Enable detailed logging in development
  logging: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: 'json'
  },
  
  // Configure webpack for better debugging
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev) {
      config.devtool = 'eval-source-map'
    }
    
    // Return modified config
    return config
  }
}

module.exports = nextConfig

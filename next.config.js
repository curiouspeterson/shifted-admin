/** @type {import('next').NextConfig} */

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\./i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
      {
        urlPattern: /\/_next\/image\?url/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'image-cache',
          expiration: {
            maxEntries: 64,
            maxAgeSeconds: 24 * 60 * 60, // 24 hours
          },
        },
      },
    ],
  },
});

const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    // Fix for ESM modules
    config.module.rules.push({
      test: /\.(mjs|js|jsx)$/,
      include: [
        /node_modules\/@radix-ui/,
        /node_modules\/date-fns/
      ],
      type: 'javascript/auto',
      resolve: {
        fullySpecified: false
      }
    })

    // Fallbacks for Node.js modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        module: false,
        path: false,
        os: false,
      }
    }

    return config
  },
  transpilePackages: [
    '@radix-ui/react-popper',
    '@radix-ui/react-select',
    'date-fns'
  ],
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ],
      },
    ]
  },
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  images: {
    domains: ['localhost'],
  },
  reactStrictMode: true,
};

// Export the configuration with PWA support
module.exports = withPWA(nextConfig);

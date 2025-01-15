/** @type {import('next').NextConfig} */

// This file sets up Sentry SDK for Next.js
const { withSentryConfig } = require('@sentry/nextjs');

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
  
  // Configure Sentry manually since we're using the Next.js SDK
  sentry: {
    // Use `hidden-source-map` in production
    hideSourceMaps: process.env.NODE_ENV === 'production',
    
    // Automatically instrument Next.js components
    autoInstrumentServerFunctions: true,
    
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/
  },
};

// For all available options, see:
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

const sentryWebpackPluginOptions = {
  // Additional config options for the Sentry webpack plugin
  silent: true, // Suppresses all logs
  
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options
  
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  
  // Upload source maps only in production
  deploy: {
    env: process.env.NODE_ENV,
  },
};

// Make sure adding Sentry options is the last code to run before exporting
module.exports = withPWA(withSentryConfig(
  nextConfig,
  sentryWebpackPluginOptions
)); 

// Injected content via Sentry wizard below

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  module.exports,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: "scattered-vibes",
    project: "shifted",

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Automatically annotate React components to show their full name in breadcrumbs and session replay
    reactComponentAnnotation: {
      enabled: true,
    },

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,

    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,
  }
);

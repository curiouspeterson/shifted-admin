/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  // Add compression
  compress: true,
  // Configure server options
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Add custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Accept-Encoding',
            value: 'gzip, deflate, br',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 
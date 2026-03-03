import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Trỏ đến file cấu hình request của next-intl
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.youware.com',
        port: '',
        pathname: '/users-website-assets/**',
      },
    ],
  },
  // API configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // In Docker, use internal service DNS (or override via env)
        // Always use internal Docker DNS for server-side proxy
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ]
  },
  // Prevent automatic trailing slash redirect
  trailingSlash: false,

  // Disable automatic trailing slash redirect for API routes
  skipProxyUrlNormalize: true,
  skipTrailingSlashRedirect: true,
}

export default withNextIntl(nextConfig)
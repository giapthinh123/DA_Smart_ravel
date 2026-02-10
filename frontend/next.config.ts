import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    domains: ['public.youware.com'],
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
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://backend:5000'}/api/:path*`,
      },
    ]
  },
  // Prevent automatic trailing slash redirect
  trailingSlash: false,
  // Environment variables - removed NEXT_PUBLIC_API_BASE_URL as axios.ts handles this correctly
  // Browser uses empty string for same-origin requests through Next.js rewrites
  // Disable ESLint during production builds to avoid lint errors blocking build
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable automatic trailing slash redirect for API routes
  skipMiddlewareUrlNormalize: true,
  skipTrailingSlashRedirect: true,
}

export default nextConfig
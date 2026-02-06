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
        destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'}/api/:path*`,
      },
    ]
  },
  // Environment variables
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
  },
}

export default nextConfig
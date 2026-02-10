// Client-side environment variables
export const env = {
  // Empty string for browser = same-origin requests through Next.js rewrites
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
} as const

// Type-safe environment validation
function validateEnv() {
  const required = {
    NEXT_PUBLIC_API_BASE_URL: env.API_BASE_URL,
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}

// Only validate in browser
if (typeof window !== 'undefined') {
  validateEnv()
}

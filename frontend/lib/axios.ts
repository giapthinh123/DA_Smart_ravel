import axios from 'axios'
import { env } from './env'

// Trong browser dùng '' để request qua Next rewrite (same-origin), tránh CORS và mất body
// Trên server (Next.js SSR trong Docker), dùng Docker internal DNS
const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    // Browser: always use relative URL to go through Next.js rewrite
    return ''
  }

  // Server-side: use internal Docker DNS or localhost for development
  // INTERNAL_API_URL is set via Docker Compose for server-side calls
  return process.env.INTERNAL_API_URL || 'http://backend:5000'
}

// Create axios instance
export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000, // 60 seconds for flight API calls
  headers: {
    'Content-Type': 'application/json',
  },
  // CRITICAL: Prevent axios from following redirects to absolute URLs
  // This ensures we always use relative paths in browser
  maxRedirects: 0,
  // Ngăn axios tự động log lỗi ra console
  validateStatus: function (status) {
    // Accept 3xx redirects as valid responses (Next.js will handle them)
    return status < 400
  }
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // Use AuthService for token retrieval (handles expiry check)
      const { AuthService } = require('@/services/auth.service')
      const token = AuthService.getStoredToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Kiểm tra nếu response có status code >= 400 thì reject
    if (response.status >= 400) {
      return Promise.reject({
        response: response,
        message: `Request failed with status code ${response.status}`,
        config: response.config
      })
    }
    return response
  },
  async (error) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        const requestUrl: string = error.config?.url || ''

        // Skip redirect for auth-specific routes (e.g. wrong password → 401)
        // Only treat 401 as "session expired" for protected data API calls
        const isAuthRoute = requestUrl.includes('/api/auth/')
        if (isAuthRoute) {
          return Promise.reject(error)
        }

        // Clear storage directly without calling API (token is already invalid)
        const { AuthService } = require('@/services/auth.service')
        AuthService.clearStorage()

        // Reset Zustand store state (without calling API logout)
        import('@/store/useAuthStore').then(({ useAuthStore }) => {
          useAuthStore.setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          })
        }).catch(() => { })

        // Redirect to login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          // Show toast before redirect
          import('@/lib/toast').then(({ toast }) => {
            toast.warning('Vui lòng đăng nhập lại để tiếp tục.', 'Phiên đăng nhập hết hạn')
          })
          setTimeout(() => { window.location.href = '/login' }, 1200)
        }
      }
    }

    return Promise.reject(error)
  }
)

export default api
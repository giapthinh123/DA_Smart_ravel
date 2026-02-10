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
    // Get token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
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
  (error) => {
    // Handle 401 unauthorized
    if (error.response?.status === 401) {
      // Clear auth data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }
    
    // Xử lý im lặng - không log ra console
    return Promise.reject(error)
  }
)

export default api
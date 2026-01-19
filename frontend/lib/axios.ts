import axios from 'axios'
import { env } from './env'

// Create axios instance
export const api = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 60000, // 60 seconds for flight API calls
  headers: {
    'Content-Type': 'application/json',
  },
  // Ngăn axios tự động log lỗi ra console
  validateStatus: function (status) {
    return status < 600 // Chấp nhận mọi status code < 600
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
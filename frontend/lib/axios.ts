import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    return ''
  }
  return process.env.INTERNAL_API_URL || 'http://backend:5000'
}

export const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  maxRedirects: 0,
  validateStatus: function (status) {
    return status < 400
  },
})

// --- token-refresh state shared across interceptors ---
let isRefreshing = false
let pendingQueue: {
  resolve: (token: string) => void
  reject: (err: unknown) => void
}[] = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token!)
  })
  pendingQueue = []
}

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const { AuthService } = require('@/services/auth.service')
      const token = AuthService.getStoredToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => {
    if (response.status >= 400) {
      return Promise.reject({
        response,
        message: `Request failed with status code ${response.status}`,
        config: response.config,
      })
    }
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const requestUrl: string = originalRequest?.url || ''

      const isAuthRoute = requestUrl.includes('/api/auth/')
      if (isAuthRoute) {
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        forceLogout()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { AuthService } = require('@/services/auth.service')
        const newToken = await AuthService.refreshAccessToken()
        processQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        forceLogout()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

function forceLogout() {
  if (typeof window === 'undefined') return

  const { AuthService } = require('@/services/auth.service')
  AuthService.clearStorage()

  import('@/store/useAuthStore')
    .then(({ useAuthStore }) => {
      useAuthStore.setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    })
    .catch(() => {})

  if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
    import('@/lib/toast').then(({ toast }) => {
      toast.warning('Vui lòng đăng nhập lại để tiếp tục.', 'Phiên đăng nhập hết hạn')
    })
    setTimeout(() => {
      window.location.href = '/login'
    }, 1200)
  }
}

export default api

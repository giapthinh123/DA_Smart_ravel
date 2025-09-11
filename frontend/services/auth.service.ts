import api from '@/lib/axios'
import { LoginCredentials, RegisterData, AuthData, User } from '@/types/domain'
import { ApiResponse } from '@/types/api'

export class AuthService {
  /**
   * Login user
   */
  static async login(credentials: LoginCredentials): Promise<AuthData> {
    const response = await api.post<ApiResponse<AuthData>>('/api/auth/login', credentials)
    
    if (response.data.success && response.data.data) {
      // Store auth data
      localStorage.setItem('auth_token', response.data.data.token)
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user))
      
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Login failed')
  }

  /**
   * Register new user
   */
  static async register(userData: RegisterData): Promise<AuthData> {
    const response = await api.post<ApiResponse<AuthData>>('/api/auth/register', userData)
    
    if (response.data.success && response.data.data) {
      // Store auth data
      localStorage.setItem('auth_token', response.data.data.token)
      localStorage.setItem('user_data', JSON.stringify(response.data.data.user))
      
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Registration failed')
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/api/auth/me')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Failed to get user data')
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false
    
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')
    
    return !!(token && userData)
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null
    
    try {
      const userData = localStorage.getItem('user_data')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Error parsing stored user data:', error)
      return null
    }
  }

  /**
   * Get stored auth token
   */
  static getStoredToken(): string | null {
    if (typeof window === 'undefined') return null
    
    return localStorage.getItem('auth_token')
  }
}
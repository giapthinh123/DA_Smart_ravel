import api from '@/lib/axios'
import { LoginCredentials, RegisterData, AuthData, User } from '@/types/domain'
import { ApiResponse } from '@/types/api'

export class AuthService {
  /**
   * Login user
   */
  private static readonly STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    REFRESH_TOKEN: 'refresh_token',
    TOKEN_EXPIRY: 'token_expiry',
  }

  static async login(credentials: LoginCredentials & { remember?: boolean }): Promise<AuthData> {
    try {
      const response = await api.post('/api/auth/login', credentials)

      if (response.data.status === 'error') {
        throw new Error(response.data.msg)
      }

      if (response.data && response.data.auth_token && response.data.user) {
        // Lưu tokens
        localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, response.data.auth_token)

        // Lưu refresh token nếu có
        if (response.data.refresh_token) {
          localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, response.data.refresh_token)
        }

        const user = {
          ...response.data.user,
          id: response.data.user.id || '',
        }

        localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(user))

        // Set token expiry based on "remember me" option
        const expiryTime = credentials.remember
          ? Date.now() + (7 * 24 * 60 * 60 * 1000)  // 7 days
          : Date.now() + (24 * 60 * 60 * 1000)      // 1 day

        localStorage.setItem(this.STORAGE_KEYS.TOKEN_EXPIRY, expiryTime.toString())

        return {
          token: response.data.auth_token,
          refreshToken: response.data.refresh_token,
          user: user
        }
      }

      throw new Error('Login failed - Invalid response format')
    } catch (error: any) {
      // Xử lý lỗi im lặng - chỉ throw message, không log
      if (error.response?.data?.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('Login failed')
    }
  }
  /**
   * Register new user
   */
  static async register(userData: RegisterData): Promise<AuthData> {
    const response = await api.post('/api/auth/register', userData)

    if (response.data && response.data.msg === "Register success") {

      return await this.login({
        email: userData.email,
        password: userData.password
      })
    }

    throw new Error(response.data?.msg || 'Registration failed')
  }

  /**
   * Logout user
   */
  static async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout')
    } finally {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    }
  }

  /**
   * Get current user profile
   */
  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/api/auth/me')

    if (response.data && response.data.user) {
      return response.data.user
    }

    throw new Error(response.data?.msg || 'Failed to get user data')
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false

    const token = localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN)
    const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA)

    return !!(token && userData)
  }

  /**
   * Get stored user data
   */
  static getStoredUser(): User | null {
    if (typeof window === 'undefined') return null

    try {
      const userData = localStorage.getItem(this.STORAGE_KEYS.USER_DATA)
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

    const expiry = localStorage.getItem(this.STORAGE_KEYS.TOKEN_EXPIRY)
    if (expiry && Date.now() > parseInt(expiry)) {
      // Token expired, clear storage
      this.clearStorage()
      return null
    }

    return localStorage.getItem(this.STORAGE_KEYS.AUTH_TOKEN)
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(): Promise<string> {
    const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN)
    if (!refreshToken) throw new Error('No refresh token available')

    const response = await api.post('/api/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${refreshToken}` }
    })

    if (response.data && response.data.auth_token) {
      localStorage.setItem(this.STORAGE_KEYS.AUTH_TOKEN, response.data.auth_token)
      return response.data.auth_token
    }

    throw new Error('Failed to refresh token')
  }

  /**
   * Clear all auth storage (without calling API)
   */
  static clearStorage(): void {
    if (typeof window === 'undefined') return
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }

  /**
   * Update user profile
   */
  static async updateProfile(data: {
    fullname?: string
    phone?: string
    address?: string
  }): Promise<User> {
    try {
      const response = await api.put('/api/users/profile', data)

      if (response.data && response.data.user) {
        // Update stored user data
        localStorage.setItem(this.STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user))
        return response.data.user
      }

      throw new Error(response.data?.msg || 'Failed to update profile')
    } catch (error: any) {
      if (error.response?.data?.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('Failed to update profile')
    }
  }

  /**
   * Change password
   */
  static async changePassword(data: {
    currentPassword: string
    newPassword: string
  }): Promise<void> {
    try {
      const response = await api.put('/api/auth/change-password', data)

      if (response.data?.msg === 'Password changed successfully') {
        return
      }

      throw new Error(response.data?.msg || 'Failed to change password')
    } catch (error: any) {
      if (error.response?.data?.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('Failed to change password')
    }
  }

  /**
   * Delete account (soft delete - set status to 'delete')
   */
  static async deleteAccount(password: string): Promise<void> {
    try {
      const response = await api.delete('/api/users/profile', {
        data: { password }
      })

      if (response.data?.msg === 'Account deleted successfully') {
        // Clear all stored data
        Object.values(this.STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key)
        })
        return
      }

      throw new Error(response.data?.msg || 'Failed to delete account')
    } catch (error: any) {
      if (error.response?.data?.msg) {
        throw new Error(error.response.data.msg)
      }
      throw new Error('Failed to delete account')
    }
  }
}
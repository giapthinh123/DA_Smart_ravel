'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, LoginCredentials, RegisterData } from '@/types/domain'
import { AuthService } from '@/services/auth.service'
import { toast } from '@/lib/toast'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  _hasHydrated: boolean  // Track if Zustand has finished rehydration
}

interface AuthActions {
  login: (credentials: LoginCredentials & { remember?: boolean }) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void> | void
  clearError: () => void
  setLoading: (loading: boolean) => void
  updateUser: (user: User) => void
}

type AuthStore = AuthState & AuthActions

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // State
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        _hasHydrated: false,

        // Actions
        login: async (credentials: LoginCredentials & { remember?: boolean }) => {
          set({ isLoading: true, error: null })

          try {
            const authData = await AuthService.login(credentials)
            const name = authData.user?.fullname || authData.user?.name || authData.user?.email || 'bạn'
            set({
              user: authData.user,
              token: authData.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            toast.success(`Chào mừng trở lại, ${name}!`, 'Đăng nhập thành công')
          } catch (error) {
            const msg = error instanceof Error ? error.message : 'Đăng nhập thất bại'
            set({
              isLoading: false,
              error: msg,
            })
            toast.error(msg, 'Đăng nhập thất bại')
            throw error
          }
        },

        register: async (userData: RegisterData) => {
          set({ isLoading: true, error: null })

          try {
            const authData = await AuthService.register(userData)

            set({
              user: authData.user,
              token: authData.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Registration failed',
            })
            throw error
          }
        },

        logout: async () => {
          set({ isLoading: true })
          try {
            await AuthService.logout()
          } catch (error) {
            console.error('Logout error:', error)
          } finally {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            })
            toast.info('Hẹn gặp lại!', 'Đã đăng xuất')
          }
        },

        checkAuth: async () => {
          if (typeof window === 'undefined') return

          const token = AuthService.getStoredToken()
          if (!token) {
            AuthService.clearStorage()
            set({ user: null, token: null, isAuthenticated: false })
            return
          }

          try {
            const user = await AuthService.getCurrentUser()
            set({ user, token, isAuthenticated: true })
            localStorage.setItem('user_data', JSON.stringify(user))
          } catch {
            AuthService.clearStorage()
            set({ user: null, token: null, isAuthenticated: false })
          }
        },

        clearError: () => set({ error: null }),

        setLoading: (loading: boolean) => set({ isLoading: loading }),

        updateUser: (user: User) => {
          set({ user })
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('user_data', JSON.stringify(user))
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
        // Skip hydration to avoid conflicts with manual localStorage check
        skipHydration: false,
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error || typeof window === 'undefined') {
              if (state) state._hasHydrated = true
              return
            }

            // Use AuthService as single source of truth
            const token = AuthService.getStoredToken()
            const user = AuthService.getStoredUser()

            if (token && user && state) {
              state.user = user
              state.token = token
              state.isAuthenticated = true
              state._hasHydrated = true
            } else if (state) {
              // Token expired or not found, clear everything
              AuthService.clearStorage()
              state.user = null
              state.token = null
              state.isAuthenticated = false
              state._hasHydrated = true
            }
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

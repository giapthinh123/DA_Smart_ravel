'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { User, AuthData, LoginCredentials, RegisterData } from '@/types/domain'
import { AuthService } from '@/services/auth.service'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
  clearError: () => void
  setLoading: (loading: boolean) => void
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

        // Actions
        login: async (credentials: LoginCredentials) => {
          set({ isLoading: true, error: null })
          
          try {
            const authData = await AuthService.login(credentials)
            
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
              error: error instanceof Error ? error.message : 'Login failed',
            })
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
          }
        },

        checkAuth: () => {
          if (typeof window === 'undefined') return
          
          const isAuth = AuthService.isAuthenticated()
          const storedUser = AuthService.getStoredUser()
          const storedToken = AuthService.getStoredToken()
          
          if (isAuth && storedUser && storedToken) {
            set({
              user: storedUser,
              token: storedToken,
              isAuthenticated: true,
            })
          } else {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
          }
        },

        clearError: () => set({ error: null }),
        
        setLoading: (loading: boolean) => set({ isLoading: loading }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
)

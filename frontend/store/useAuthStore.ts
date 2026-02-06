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
  _hasHydrated: boolean  // Track if Zustand has finished rehydration
}

interface AuthActions {
  login: (credentials: LoginCredentials & { remember?: boolean }) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => void
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
            console.log('Auth data:', authData)
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
          
          console.log('🔍 CheckAuth called')
          
          const token = localStorage.getItem('auth_token')
          const userData = localStorage.getItem('user_data')
          const tokenExpiry = localStorage.getItem('token_expiry')
          
          console.log('📊 LocalStorage state:', {
            hasToken: !!token,
            hasUserData: !!userData,
            hasExpiry: !!tokenExpiry,
            tokenExpiry: tokenExpiry,
            now: Date.now(),
            isExpired: tokenExpiry ? Date.now() > parseInt(tokenExpiry) : 'no expiry'
          })
          
          // Check if token is expired
          if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
            console.log('⏰ Token expired, logging out')
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
            localStorage.clear()
            return
          }
          
          // Restore session from localStorage
          if (token && userData) {
            try {
              const user = JSON.parse(userData)
              console.log('✅ Restoring session:', user.email)
              set({
                user,
                token,
                isAuthenticated: true,
              })
            } catch (error) {
              console.error('❌ Failed to parse user data:', error)
              set({
                user: null,
                token: null,
                isAuthenticated: false,
              })
            }
          } else {
            console.log('❌ No token or user data found')
            set({
              user: null,
              token: null,
              isAuthenticated: false,
            })
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
            if (error) {
              console.error('❌ Hydration error:', error)
              if (state) {
                state._hasHydrated = true
              }
              return
            }
            
            if (typeof window === 'undefined') {
              if (state) {
                state._hasHydrated = true
              }
              return
            }
            
            console.log('💧 Rehydration complete, checking auth...')
            
            // Check token expiry immediately after rehydration
            const tokenExpiry = localStorage.getItem('token_expiry')
            const token = localStorage.getItem('auth_token')
            const userData = localStorage.getItem('user_data')
            
            console.log('📊 Rehydration check:', {
              hasToken: !!token,
              hasUserData: !!userData,
              hasExpiry: !!tokenExpiry,
              isExpired: tokenExpiry ? Date.now() > parseInt(tokenExpiry) : 'no expiry'
            })
            
            // If token is expired, clear everything
            if (tokenExpiry && Date.now() > parseInt(tokenExpiry)) {
              console.log('⏰ Token expired on rehydration')
              localStorage.clear()
              if (state) {
                state.user = null
                state.token = null
                state.isAuthenticated = false
                state._hasHydrated = true
              }
              return
            }
            
            // If we have valid token and user data but state is missing, restore it
            if (token && userData && state) {
              try {
                const user = JSON.parse(userData)
                console.log('✅ Restoring session on rehydration:', user.email)
                state.user = user
                state.token = token
                state.isAuthenticated = true
                state._hasHydrated = true
              } catch (error) {
                console.error('❌ Failed to parse user data:', error)
                state._hasHydrated = true
              }
            } else if (state) {
              // No session to restore, mark as hydrated anyway
              state._hasHydrated = true
              console.log('ℹ️ No session to restore')
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

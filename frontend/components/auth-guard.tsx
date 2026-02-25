'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { canAccessRoute, isProtectedRoute } from '@/lib/auth-guard'
import { UserRole } from '@/types/domain'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  fallbackPath?: string
}

/**
 * Auth Guard Component
 * Protects routes based on authentication and role
 * 
 * IMPORTANT: This is for UX only. Backend MUST validate permissions.
 * Never trust frontend authorization checks for security.
 */
export function AuthGuard({ 
  children, 
  requiredRoles,
  fallbackPath = '/login' 
}: AuthGuardProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, user, checkAuth } = useAuthStore()
  const hasHydrated = useAuthStore((state) => (state as any)._hasHydrated)

  useEffect(() => {
    // Check authentication status
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    // Wait for hydration to complete before checking auth
    if (!hasHydrated) {
      console.log('⏳ Waiting for hydration...')
      return
    }

    console.log('✓ Hydration complete, checking auth...', { isAuthenticated, pathname })

    // Redirect if not authenticated
    if (!isAuthenticated && isProtectedRoute(pathname)) {
      console.log('❌ Not authenticated, redirecting to login')
      router.push(`${fallbackPath}`)
      return
    }

    // Check role-based access
    if (isAuthenticated && requiredRoles && requiredRoles.length > 0) {
      const hasRequiredRole = user?.role && requiredRoles.includes(user.role)
      
      if (!hasRequiredRole) {
        // Redirect to unauthorized page or dashboard
        router.push('/unauthorized')
        return
      }
    }

    // Check if user can access current route
    if (isAuthenticated && !canAccessRoute(pathname, user?.role)) {
      router.push('/unauthorized')
      return
    }
  }, [hasHydrated, isAuthenticated, user, pathname, requiredRoles, router, fallbackPath])

  // Show loading state while waiting for hydration
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FCBC4] mx-auto"></div>
          <p className="mt-4 text-[#1E293B]">Đang tải...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Higher Order Component for protecting pages
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles?: UserRole[]
) {
  return function ProtectedComponent(props: P) {
    return (
      <AuthGuard requiredRoles={requiredRoles}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

/**
 * Hook to check permissions in components
 */
export function usePermissions() {
  const { user } = useAuthStore()
  
  return {
    isAdmin: user?.role === 'admin',
    hasRole: (roles: UserRole[]) => user?.role && roles.includes(user.role),
    userRole: user?.role,
  }
}

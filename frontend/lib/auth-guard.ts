/**
 * Authorization Guards
 * OWASP Best Practices: Frontend validation for UX, Backend validation for security
 */

import { UserRole } from '@/types/domain'

/**
 * Check if user has required role(s)
 * NOTE: This is for UI only. Backend MUST validate permissions.
 */
export function hasRole(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false
  return allowedRoles.includes(userRole)
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole | undefined): boolean {
  return userRole === 'admin'
}

/**
 * Role-based route configuration
 */
export const PROTECTED_ROUTES = {
  // Admin only routes
  admin: [
    '/admin',
    '/admin/users',
    '/admin/settings',
    '/admin/stats',
    '/admin/reports',
  ],
  
  // Authenticated user routes
  authenticated: [
    '/dashboard',
    '/profile',
    '/flights',
  ],
} as const

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(pathname: string): boolean {
  const allProtectedRoutes = [
    ...PROTECTED_ROUTES.admin,
    ...PROTECTED_ROUTES.authenticated,
  ]
  
  return allProtectedRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if user can access route based on role
 * NOTE: Backend MUST validate this. Frontend check is for UX only.
 */
export function canAccessRoute(pathname: string, userRole: UserRole | undefined): boolean {
  // Not authenticated
  if (!userRole) return false
  
  // Check admin routes
  if (PROTECTED_ROUTES.admin.some(route => pathname.startsWith(route))) {
    return isAdmin(userRole)
  }
  
  // Authenticated routes - any logged in user
  if (PROTECTED_ROUTES.authenticated.some(route => pathname.startsWith(route))) {
    return true
  }
  
  // Public route
  return true
}

/**
 * Get redirect path based on user role after login
 */
export function getDefaultRedirectPath(userRole: UserRole): string {
  switch (userRole) {
    case 'admin':
      return '/admin'
    default:
      return '/dashboard'
  }
}

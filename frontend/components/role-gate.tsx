'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { UserRole } from '@/types/domain'
import { hasRole } from '@/lib/auth-guard'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

/**
 * Role Gate Component
 * Shows/hides UI elements based on user role
 * 
 * IMPORTANT: This is for UX only. Backend MUST validate permissions.
 * Never trust frontend authorization checks for security.
 * 
 * Example:
 * <RoleGate allowedRoles={['admin']}>
 *   <AdminButton />
 * </RoleGate>
 */
export function RoleGate({ children, allowedRoles, fallback = null }: RoleGateProps) {
  const { user } = useAuthStore()
  
  if (!hasRole(user?.role, allowedRoles)) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Show content only to admins
 */
export function AdminOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  return <RoleGate allowedRoles={['admin']} fallback={fallback}>{children}</RoleGate>
}

/**
 * Show content only to authenticated users
 */
export function AuthenticatedOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

/**
 * Show content only to guests (not authenticated)
 */
export function GuestOnly({ children, fallback }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  
  if (isAuthenticated) {
    return <>{fallback}</>
  }
  
  return <>{children}</>
}

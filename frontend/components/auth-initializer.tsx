'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * AuthInitializer - Restore session from localStorage on app load
 * This component must be placed in the root layout to run before any route guards
 */
export function AuthInitializer() {
  const checkAuth = useAuthStore((state) => state.checkAuth)

  useEffect(() => {
    // Call checkAuth immediately when app mounts
    checkAuth()
  }, [checkAuth])

  return null
}

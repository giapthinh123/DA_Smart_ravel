'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface ProvidersProps {
  children: ReactNode
}

function AuthInitializer() {
  const { checkAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from localStorage
    checkAuth()

  }, [checkAuth])

  return null
}

export function Providers({ children }: ProvidersProps) {
  return (
    <>
      <AuthInitializer />
      {children}
    </>
  )
}
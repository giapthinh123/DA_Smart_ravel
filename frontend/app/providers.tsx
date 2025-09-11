'use client'

import { ReactNode, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'

interface ProvidersProps {
  children: ReactNode
}

function AuthInitializer() {
  const { checkAuth } = useAuthStore()
  const { setSiteConfig } = useAppStore()

  useEffect(() => {
    // Initialize auth state from localStorage
    checkAuth()
    
    // Load site configuration
    const loadSiteConfig = async () => {
      try {
        const { TravelService } = await import('@/services/travel.service')
        const config = await TravelService.getSiteConfig()
        setSiteConfig(config)
      } catch (error) {
        console.error('Failed to load site config:', error)
      }
    }

    loadSiteConfig()
  }, [checkAuth, setSiteConfig])

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
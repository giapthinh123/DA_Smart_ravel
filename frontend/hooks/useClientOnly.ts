'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to check if component is mounted on client
 * Useful for preventing hydration mismatches
 */
export function useClientOnly() {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  return hasMounted
}

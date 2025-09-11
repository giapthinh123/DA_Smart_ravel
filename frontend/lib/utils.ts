import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Utility function to merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency based on currency type
 */
export function formatCurrency(amount: number, currency: 'USD' | 'VND' = 'USD'): string {
  const formatters = {
    USD: new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
    VND: new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }),
  }
  
  return formatters[currency].format(amount)
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, locale: 'en' | 'vi' = 'en'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  const formatters = {
    en: new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    vi: new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }
  
  return formatters[locale].format(dateObj)
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get minimum date for date inputs (today)
 */
export function getMinDate(): string {
  return getCurrentDate()
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Local storage helpers with error handling
 */
export const storage = {
  get: (key: string): any => {
    if (typeof window === 'undefined') return null
    
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error getting item from localStorage:`, error)
      return null
    }
  },
  
  set: (key: string, value: any): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error setting item to localStorage:`, error)
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing item from localStorage:`, error)
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.clear()
    } catch (error) {
      console.error(`Error clearing localStorage:`, error)
    }
  }
}

/**
 * Device Fingerprint Management
 * 
 * Manages device identification using a unique UUID stored in localStorage.
 * This is used to restrict user accounts to the device they registered with.
 */

const DEVICE_ID_KEY = 'device_id'

/**
 * Generate a new UUID v4
 */
export function generateDeviceId(): string {
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get existing device ID from localStorage or create a new one
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  try {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY)
    
    if (!deviceId) {
      deviceId = generateDeviceId()
      localStorage.setItem(DEVICE_ID_KEY, deviceId)
    }
    
    return deviceId
  } catch (error) {
    console.error('Error accessing localStorage for device ID:', error)
    return generateDeviceId()
  }
}

/**
 * Get existing device ID without creating a new one
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    return localStorage.getItem(DEVICE_ID_KEY)
  } catch (error) {
    console.error('Error accessing localStorage for device ID:', error)
    return null
  }
}

/**
 * Clear device ID from localStorage
 * Use with caution - this will prevent the user from logging in
 */
export function clearDeviceId(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY)
  } catch (error) {
    console.error('Error clearing device ID from localStorage:', error)
  }
}

/**
 * Check if device ID exists
 */
export function hasDeviceId(): boolean {
  return getDeviceId() !== null
}

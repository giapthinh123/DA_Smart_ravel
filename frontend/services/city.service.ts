import api from '@/lib/axios'
import { City } from '@/types/domain'

interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

const CACHE_KEY = 'cities_data'
const CACHE_TIMESTAMP_KEY = 'cities_data_timestamp'
const CACHE_DURATION = 5 * 60 * 1000 // 30 minutes in milliseconds

export class CityService {
    /**
     * Get all cities with caching strategy (30 mins)
     */
    static async getCities(): Promise<City[]> {
        // Check if we are in a browser environment
        if (typeof window === 'undefined') {
            // Server-side: fetch directly
            return this.fetchFromApi()
        }

        try {
            const cachedData = localStorage.getItem(CACHE_KEY)
            const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)

            if (cachedData && cachedTimestamp) {
                const now = new Date().getTime()
                const timestamp = parseInt(cachedTimestamp, 10)

                // Check if cache is still valid
                if (now - timestamp < CACHE_DURATION) {
                    // console.log('Serving cities from cache')
                    return JSON.parse(cachedData)
                }
            }
        } catch (error) {
            console.warn('Failed to read from localStorage', error)
        }

        // Cache expired or missing, fetch from API
        // console.log('Fetching cities from API')
        return this.fetchAndCache()
    }

    private static async fetchAndCache(): Promise<City[]> {
        const data = await this.fetchFromApi()

        // Save to cache
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data))
                localStorage.setItem(CACHE_TIMESTAMP_KEY, new Date().getTime().toString())
            }
        } catch (error) {
            console.warn('Failed to save to localStorage', error)
        }

        return data
    }

    private static async fetchFromApi(): Promise<City[]> {
        // Based on user request: GET /api/citys/
        // Assuming the response structure wraps the list in some way or matches the example
        // The user example was a single object:
        // { "city": "Tokyo", ... }
        // But the endpoint is plural "citys", so it likely returns an array or a wrapped array.
        // I will assume standard API wrapper: { success: true, data: [...] } or just [...]
        // However, existing services use `ApiResponse` wrapper.

        try {
            // Note: User said "GET /api/citys/". 
            // Existing services use api.post for search, but this is a GET.
            const response = await api.get<any>('/api/citys/')

            // Handle different possible response structures
            if (response.data && Array.isArray(response.data)) {
                return response.data
            }

            if (response.data && response.data.data && Array.isArray(response.data.data)) {
                return response.data.data
            }

            // If the user's example was literally the *entire* response for one city, 
            // and the endpoint returns just that one object? Unlikely for "citys".
            // If it returns { success: true, data: [...] }
            if (response.data && response.data.success && Array.isArray(response.data.data)) {
                return response.data.data
            }

            // Fallback for single object if that's really what it is (strange for plural endpoint)
            if (response.data && response.data.city) {
                return [response.data] as City[]
            }

            throw new Error('Unexpected API response format')

        } catch (error: any) {
            throw new Error(error.message || 'Failed to fetch cities')
        }
    }
}

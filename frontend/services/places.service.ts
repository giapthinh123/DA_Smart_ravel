import api from '@/lib/axios'
import { AllPlaces, CategorizedPlaces, Place, PreferencesData } from '@/types/domain'
import { ApiResponse } from '@/types/api'

export class PlacesService {
    /**
     * Get places by city ID, categorized by type (hotel, restaurant, attraction)
     */
    static async getPlacesByCityId(cityId: string): Promise<CategorizedPlaces> {
        try {
            const response = await api.get<CategorizedPlaces>(`/api/places/${cityId}`)

            // The backend returns the categorized data directly
            return response.data
        } catch (error: any) {
            console.error('Error fetching places:', error)
            throw new Error(error.message || 'Failed to fetch places')
        }
    }

    static async getAllPlaces(): Promise<AllPlaces> {
        try {
            const response = await api.get<AllPlaces>(`/api/places`)

            // The backend returns the categorized data directly
            return response.data
        } catch (error: any) {
            console.error('Error fetching all places:', error)
            throw new Error(error.message || 'Failed to fetch places')
        }
    }
    
    /**
     * Get user preferences for a specific city
     */
    static async getPreferences(user_id: string, city_id: string): Promise<PreferencesData> {
        try {
            console.log('Getting preferences for:', { user_id, city_id })

            const response = await api.get<PreferencesData>(`/api/places/preferences/${user_id}/${city_id}`)

            console.log('Loaded preferences:', response.data)
            return response.data
        } catch (error: any) {
            console.error('Error getting preferences:', error)
            // Return empty preferences if error (user hasn't saved any yet)
            return {
                like_hotel: [],
                like_restaurant: [],
                like_attraction: [],
                like_local_transport: [],
                dislike_hotel: [],
                dislike_restaurant: [],
                dislike_attraction: [],
                dislike_local_transport: [],
            }
        }
    }

    /**
     * Set or update user preferences for a specific city
     * If preferences exist, they will be updated. Otherwise, new preferences will be created.
     */
    static async set_Preferences(user_id: string, city_id: string, preferences: PreferencesData) {
        try {
            console.log('Setting preferences:', { user_id, city_id, preferences })

            // Backend expects all fields at the root level, not nested
            const requestBody = {
                user_id,
                city_id,
                ...preferences // Spread preferences fields
            }

            const response = await api.post(`/api/places/preferences`, requestBody)

            // Backend returns: { message, action, user_id, city_id }
            console.log('Preferences response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('Error setting preferences:', error)
            const errorMessage = error.response?.data?.error || error.message || 'Failed to set preferences'
            throw new Error(errorMessage)
        }
    }

    /**
     * Create a new place
     */
    static async createPlace(data: Record<string, unknown>): Promise<Place> {
        try {
            const response = await api.post<{ message: string; place: Place }>('/api/places/place', data)
            return response.data.place
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to create place')
        }
    }

    /**
     * Update a place by ID
     */
    static async updatePlace(placeId: string, data: Record<string, unknown>): Promise<void> {
        try {
            await api.put(`/api/places/place/${placeId}`, data)
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to update place')
        }
    }

    /**
     * Delete a place by ID
     */
    static async deletePlace(placeId: string): Promise<void> {
        try {
            await api.delete(`/api/places/place/${placeId}`)
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to delete place')
        }
    }

    /**
     * Get place details by place ID
     */
    static async getPlaceById(placeId: string): Promise<{
        displayName_text: string
        rating: number
        userRatingCount: number
        avg_price: number
        editorialSummary_text?: string
        image_url?: string[]
        reviews?: Array<{
            rating: number
            text: { text: string }
            relativePublishTimeDescription: string
            authorAttribution: { displayName: string }
        }>
    }> {
        try {
            const response = await api.get(`/api/places/place/${placeId}`)
            return response.data
        } catch (error: any) {
            console.error('Error fetching place details:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to fetch place details')
        }
    }
}

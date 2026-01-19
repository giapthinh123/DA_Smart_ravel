import api from '@/lib/axios'
import { CategorizedPlaces } from '@/types/domain'
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
}

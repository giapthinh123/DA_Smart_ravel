import api from '@/lib/axios'

// Types
export interface PlaceBlock {
    id: string
    name: string
    rating: number
    userRatingCount: number
    search_type: string
    location: { latitude: number; longitude: number }
    avg_price: number
}

export interface Block {
    block_type: 'breakfast' | 'morning_activity' | 'lunch' | 'afternoon_activity' | 'dinner' | 'hotel'
    time_range: string
    place: PlaceBlock
    estimated_cost: number
    transport_to_next?: string
    distance_to_next_km?: number
    travel_time_minutes?: number
}

export interface DayItinerary {
    day_number: number
    date: string
    blocks: Block[]
    day_cost: number
}

export interface ItinerarySummary {
    total_places: number
    total_cost: number
    cost_per_person: number
    budget_utilized_percent: number
    avg_cost_per_day: number
}

export interface Itinerary {
    itinerary_id: string
    user_id: string
    city_id: string
    trip_duration_days: number
    start_date: string
    guest_count: number
    budget: number
    status: 'pending' | 'complete'
    daily_itinerary: DayItinerary[]
    summary?: ItinerarySummary
    generated_at?: string
    created_at?: string
    updated_at?: string
}

export interface CreateItineraryRequest {
    city_id: string
    trip_duration_days: number
    start_date: string
    guest_count?: number
    budget?: number
}

export interface CreateItineraryResponse {
    itinerary_id: string
    user_id: string
    city_id: string
    trip_duration_days: number
    start_date: string
    status: 'pending'
    message: string
}

export interface GenerateDayRequest {
    itinerary_id: string
    day_number: number
}

export interface GenerateDayResponse {
    itinerary_id: string
    day_number: number
    day: DayItinerary
    status: 'pending' | 'complete'
    days_generated: number
    days_remaining: number
    summary?: ItinerarySummary
}

export interface UserItinerariesResponse {
    count: number
    itineraries: Itinerary[]
}

export class ItineraryService {
    /**
     * Create a new itinerary with pending status
     */
    static async createItinerary(data: CreateItineraryRequest): Promise<CreateItineraryResponse> {
        try {
            console.log('[ItineraryService] Creating itinerary:', data)
            const response = await api.post<CreateItineraryResponse>('/api/itinerary/create', data)
            console.log('[ItineraryService] Create response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[ItineraryService] Error creating itinerary:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to create itinerary')
        }
    }

    /**
     * Generate a single day for an existing itinerary
     */
    static async generateDay(data: GenerateDayRequest): Promise<GenerateDayResponse> {
        try {
            console.log('[ItineraryService] Generating day:', data)
            const response = await api.post<GenerateDayResponse>('/api/itinerary/generate-day', data)
            console.log('[ItineraryService] Generate day response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[ItineraryService] Error generating day:', error)
            console.error('[ItineraryService] Error response:', error.response?.data)
            throw new Error(error.response?.data?.error || error.message || 'Failed to generate day')
        }
    }

    /**
     * Get an itinerary by ID
     */
    static async getItinerary(itineraryId: string): Promise<Itinerary> {
        try {
            console.log('[ItineraryService] Getting itinerary:', itineraryId)
            const response = await api.get<Itinerary>(`/api/itinerary/${itineraryId}`)
            console.log('[ItineraryService] Get itinerary response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[ItineraryService] Error getting itinerary:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to get itinerary')
        }
    }

    /**
     * Get all itineraries for current user
     */
    static async getUserItineraries(): Promise<UserItinerariesResponse> {
        try {
            const response = await api.get<UserItinerariesResponse>('/api/itinerary/user')
            return response.data
        } catch (error: any) {
            console.error('Error getting user itineraries:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to get itineraries')
        }
    }

    /**
     * Delete an itinerary
     */
    static async deleteItinerary(itineraryId: string): Promise<{ message: string }> {
        try {
            const response = await api.delete<{ message: string }>(`/api/itinerary/${itineraryId}`)
            return response.data
        } catch (error: any) {
            console.error('Error deleting itinerary:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to delete itinerary')
        }
    }

    /**
     * Delete a specific day from itinerary to allow regeneration
     */
    static async deleteDay(itineraryId: string, dayNumber: number): Promise<{ message: string }> {
        try {
            console.log(`[ItineraryService] Deleting day ${dayNumber} from itinerary ${itineraryId}`)
            const response = await api.delete<{ message: string }>(`/api/itinerary/${itineraryId}/day/${dayNumber}`)
            console.log('[ItineraryService] Delete day response:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[ItineraryService] Error deleting day:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to delete day')
        }
    }

    /**
     * Regenerate a specific day (delete then generate)
     * If day doesn't exist, just generate it (for new days)
     */
    static async regenerateDay(itineraryId: string, dayNumber: number): Promise<GenerateDayResponse> {
        console.log(`[ItineraryService] Regenerating day ${dayNumber}...`)
        
        // Try to delete the existing day (if it exists)
        try {
            await this.deleteDay(itineraryId, dayNumber)
            console.log(`[ItineraryService] Deleted existing day ${dayNumber}`)
        } catch (error: any) {
            // If day doesn't exist (404), that's fine - we'll just generate it
            if (error.response?.status === 404 || error.message?.includes('not found')) {
                console.log(`[ItineraryService] Day ${dayNumber} doesn't exist yet, will generate new`)
            } else {
                // For other errors, log but continue to generate
                console.warn(`[ItineraryService] Error deleting day (may not exist):`, error)
            }
        }
        
        // Then generate it (or generate it for the first time)
        return this.generateDay({
            itinerary_id: itineraryId,
            day_number: dayNumber
        })
    }

    /**
     * Generate all days sequentially for an itinerary
     * Returns an async generator that yields each day as it's generated
     */
    static async *generateAllDays(
        itineraryId: string, 
        totalDays: number
    ): AsyncGenerator<GenerateDayResponse, void, unknown> {
        for (let day = 1; day <= totalDays; day++) {
            const result = await this.generateDay({
                itinerary_id: itineraryId,
                day_number: day
            })
            yield result
        }
    }
}

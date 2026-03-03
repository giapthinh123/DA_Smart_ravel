import api from '@/lib/axios'

export interface TourActivityInput {
    place_id: string
    time: string
    duration_hours: number
    meal?: 'breakfast' | 'lunch' | 'dinner'
}

export interface TourDayInput {
    day_number: number
    theme: string
    activities: TourActivityInput[]
}

export interface TourCreatePayload {
    title: string
    description: string
    destination: {
        city: string
        country: string
    }
    duration_days: number
    accommodation: {
        hotel_id: string
    }
    itinerary: TourDayInput[]
    pricing: {
        accommodation: number
        activities: number
        transportation: number
        misc: number
        total: number
    }
}

export interface TourActivity {
    time: string
    duration_hours: number
    place_id: string
    name: string
    type: 'attraction' | 'restaurant'
    rating: number
    estimated_cost: number
    meal?: string
}

export interface TourDay {
    day_number: number
    theme: string
    activities: TourActivity[]
    estimated_daily_cost: number
}

export interface TourDocument {
    tour_id: string
    title: string
    description: string
    destination: {
        city: string
        country: string
    }
    duration_days: number
    accommodation: {
        hotel_id: string
        hotel_name: string
        hotel_rating: number
        price_per_night: number
        images: string[]
    }
    itinerary: TourDay[]
    pricing: {
        accommodation: number
        activities: number
        transportation: number
        misc: number
        total: number
    }
    created_by: string
    created_at: string
}

export class TourService {
    static async createTour(data: TourCreatePayload): Promise<TourDocument> {
        const response = await api.post<{ message: string; tour: TourDocument }>('/api/tours/', data)
        return response.data.tour
    }

    static async getAllTours(): Promise<TourDocument[]> {
        const response = await api.get<{ tours: TourDocument[] }>('/api/tours/')
        return response.data.tours
    }

    static async getTour(tourId: string): Promise<TourDocument> {
        const response = await api.get<TourDocument>(`/api/tours/${tourId}`)
        return response.data
    }

    static async updateTour(tourId: string, data: TourCreatePayload): Promise<TourDocument> {
        const response = await api.put<{ message: string; tour: TourDocument }>(`/api/tours/${tourId}`, data)
        return response.data.tour
    }

    static async deleteTour(tourId: string): Promise<void> {
        await api.delete(`/api/tours/${tourId}`)
    }
}

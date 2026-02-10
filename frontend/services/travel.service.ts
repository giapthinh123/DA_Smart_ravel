import api from '@/lib/axios'
import { TravelSearchParams, HotelSearchParams, AirlineSearchParams, Tour, FlightsByAirline } from '@/types/domain'
import { ApiResponse } from '@/types/api'

export class TravelService {


  /**
   * Search personalized travel tours
   */
  static async searchTravel(params: TravelSearchParams): Promise<any> {
    const response = await api.post<ApiResponse>('/api/travel/search', params)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Travel search failed')
  }

  /**
   * Search hotels
   */
  static async searchHotels(params: HotelSearchParams): Promise<any> {
    const response = await api.post<ApiResponse>('/api/hotels/search', params)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Hotel search failed')
  }

  /**
   * Search airline tickets.
   * POST /api/flights with { departure_city, arrival_city, departure_date }.
   * Returns flights grouped by airline name.
   */
  static async searchFlights(params: AirlineSearchParams): Promise<FlightsByAirline> {
    const body = {
      departure_city: String(params.departure_city ?? '').trim(),
      arrival_city: String(params.arrival_city ?? '').trim(),
      departure_date: String(params.departure_date ?? '').trim(),
    }
    const response = await api.post<ApiResponse<FlightsByAirline>>('/api/flights', body, {
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.data.success && response.data.data != null) {
      return response.data.data
    }

    throw new Error(
      (response.data as { message?: string })?.message || 'Flight search failed'
    )
  }
  /**
   * Get tour details
   */
  static async getTourDetails(tourId: string): Promise<Tour> {
    const response = await api.get<ApiResponse<Tour>>(`/api/tours/${tourId}`)
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Failed to get tour details')
  }

  /**
   * Subscribe to newsletter
   */
  static async subscribeNewsletter(email: string): Promise<void> {
    const response = await api.post<ApiResponse>('/api/newsletter/subscribe', { email })
    
    if (!response.data.success) {
      throw new Error(response.data.message || 'Newsletter subscription failed')
    }
  }
}

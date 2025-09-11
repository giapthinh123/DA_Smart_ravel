import api from '@/lib/axios'
import { TravelSearchParams, HotelSearchParams, AirlineSearchParams, Tour, SiteConfig } from '@/types/domain'
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
   * Search airline tickets
   */
  static async searchFlights(params: AirlineSearchParams): Promise<any> {
    const response = await api.post<ApiResponse>('/api/flights/search', params)
    
    if (response.data.success) {
      return response.data.data
    }
    
    throw new Error(response.data.message || 'Flight search failed')
  }

  /**
   * Get featured tours
   */
  static async getFeaturedTours(): Promise<Tour[]> {
    const response = await api.get<ApiResponse<Tour[]>>('/api/tours/featured')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    return [] // Return empty array if no tours found
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
   * Get site configuration
   */
  static async getSiteConfig(): Promise<SiteConfig> {
    const response = await api.get<ApiResponse<SiteConfig>>('/api/admin/load-config')
    
    if (response.data.success && response.data.data) {
      return response.data.data
    }
    
    // Return default config if API fails
    return {
      timezone: 'Asia/Ho_Chi_Minh',
      version: '1.0.0',
      showVersionFooter: true
    }
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

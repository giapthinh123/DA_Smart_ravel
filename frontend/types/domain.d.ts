export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  fullname?: string
  name?: string
  email: string
  phone?: string
  address?: string
  role: UserRole
  status: 'active' | 'inactive'
  gender?: 'Male' | 'Female' | 'Other'
  birthYear?: number
  premium_plan?: 'monthly' | 'yearly' | 'lifetime' | null
  premium_status?: 'active' | 'expired' | 'none'
  premium_expiry_date?: string | null
  created_at: string
  updated_at: string
}

export interface TravelSearchParams {
  departure: string
  destination: string
  departureTime: string
  departureDate: string
  transport: 'Plane' | 'Tourist Bus' | 'Car'
  hotel?: string
  restaurant?: string
  recreation?: string
  days: number
  budget: number
  localTransport?: 'Motorbike' | 'Taxi' | 'Bus' | 'Bicycle'
}

export interface HotelSearchParams {
  location: string
  checkin: string
  checkout: string
  guests: string
}

export interface AirlineSearchParams {
  departure_city: string
  arrival_city: string
  departure_date: string
}

/** Stopover at an intermediate airport */
export interface FlightStop {
  iata: string
  name: string
  arrival: string
  departure: string
}

/** Single flight option from flights API */
export interface FlightOption {
  airline: string
  flight_code: string
  dep_iata: string
  arr_iata: string
  dep_airport: string
  arr_airport: string
  dep_time: string
  arr_time: string
  price: string
  currency: string
  stops: FlightStop[]
}

/** Flights API response: airline name -> list of flights */
export type FlightsByAirline = Record<string, FlightOption[]>

export interface Tour {
  id: string
  title: string
  location: string
  duration: string
  price: number
  currency: string
  image: string
  description?: string
}

export interface AuthData {
  user: User
  token: string
  refreshToken?: string
}

export interface LoginCredentials {
  email: string
  password: string
  remember?: boolean
}

export interface RegisterData {
  fullname?: string
  name?: string
  email: string
  password: string
  phone?: string
  gender?: string
  birthYear?: number
}

export type Currency = 'USD' | 'VND'
export type Language = 'en' | 'vi'

export interface SiteConfig {
  timezone: string
  version: string
  showVersionFooter: boolean
}

export interface City {
  id: string
  city: string
  country: string
  location: {
    lat: string
    lng: string
  }
}

export interface data_flight_search {
  departure_city: string
  arrival_city: string
  departure_date: string
}

export interface data_flight {
  airline: string
  airlineCode: string
  departure: string
  arrival: string
  departureCode: string
  arrivalCode: string
  duration: string
  price: number
}

/** Stopover at an intermediate airport (for itinerary flight payload) */
export interface FlightStopForItinerary {
  iata: string
  name: string
  arrival: string
  departure: string
}

/** Selected flight from flights page (for itinerary / book_flight) */
export interface SelectedFlightForItinerary {
  airline: string
  airlineCode: string
  departTime: string
  arriveTime: string
  departCode: string
  arriveCode: string
  duration: string
  stop_count: number
  price: number
  /** When flight has stopover(s) */
  stops?: FlightStopForItinerary[]
}

export interface FlightsSelectionPayload {
  selectedDepartureFlight: SelectedFlightForItinerary
  selectedReturnFlight: SelectedFlightForItinerary
}

/** Trip data extended with book_flight and flights (from flights page → preferences) */
export interface data_build_tour {

  departure_city_id: string
  destination_city_id: string

  departure: string
  destination: string
  departureDate: string
  returnDate: string
  days: number

  budget: number

  adults: number
  children: number
  infants: number

  bookflight: boolean
  flight_departure_date: string | null
  flight_return_date: string | null
  flight_departure: data_flight | null
  flight_return: data_flight | null

  /** When true, itinerary includes booked flights from flights page */
  book_flight?: boolean
  /** Flight data from flights page when book_flight is true */
  flights?: FlightsSelectionPayload
}

// Places API types
export interface PlaceLocation {
  latitude: number
  longitude: number
}

export interface Place {
  id: string
  city: string
  city_id: string
  displayName_text: string
  location: PlaceLocation
  rating: number
  userRatingCount: number
  avg_price: number
  search_type: 'hotel' | 'restaurant' | 'attraction'
}

export interface CategorizedPlaces {
  hotel: Place[]
  restaurant: Place[]
  attraction: Place[]
}
export interface AllPlaces {
  place: Place[]
}

export interface PreferencesData {
  like_hotel: Array<string>
  like_restaurant: Array<string>
  like_attraction: Array<string>
  like_local_transport: Array<string>
  dislike_hotel: Array<string>
  dislike_restaurant: Array<string>
  dislike_attraction: Array<string>
  dislike_local_transport: Array<string>
}

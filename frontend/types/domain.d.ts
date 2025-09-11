export interface User {
  id: string
  name: string
  email: string
  phone?: string
  gender?: 'Male' | 'Female' | 'Other'
  birthYear?: number
  createdAt: string
  updatedAt: string
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
  departure: string
  destination: string
  time: string
  date: string
}

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
}

export interface RegisterData {
  name: string
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

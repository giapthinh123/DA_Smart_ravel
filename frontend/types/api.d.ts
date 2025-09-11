import { User, AuthData, SiteConfig } from './domain'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  results: T[]
  count: number
  next?: string
  previous?: string
}

// Auth API responses
export interface LoginResponse extends ApiResponse<AuthData> {}
export interface RegisterResponse extends ApiResponse<AuthData> {}
export interface UserResponse extends ApiResponse<User> {}

// Config API responses
export interface ConfigResponse extends ApiResponse<SiteConfig> {}

// Search API responses
export interface SearchResponse extends ApiResponse<any> {}

// Error response
export interface ErrorResponse {
  success: false
  message: string
  errors?: Record<string, string[]>
  status?: number
}

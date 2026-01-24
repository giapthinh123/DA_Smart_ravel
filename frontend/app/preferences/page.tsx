"use client"

import React, { useState, useMemo, useEffect } from 'react'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  Bus,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Hotel,
  Loader2,
  MapPin,
  Star,
  ThumbsUp,
  Utensils,
  X,
} from 'lucide-react'
import "@/style/dashboard.css"
import { useAuthStore } from "@/store/useAuthStore"
import { AdminOnly } from "@/components/role-gate"
import { AuthGuard } from "@/components/auth-guard"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PlacesService } from "@/services/places.service"
import { Place, PreferencesData } from "@/types/domain"

interface PlaceItem {
  id: string | number
  place_id?: string
  name: string
  category: string
  rating: number
  reviews: number
  price: string
  info?: string
  liked?: boolean
  skipped?: boolean
}

interface CategorySection {
  title: string
  description: string
  icon: React.ReactNode
  bgColor: string
  items: PlaceItem[]
}

const CATEGORY_CONFIG = {
  Restaurants: {
    icon: <Utensils className="w-5 h-5" />,
    bg: 'bg-red-50',
  },
  Hotels: {
    icon: <Hotel className="w-5 h-5" />,
    bg: 'bg-blue-50',
  },
  'Recreation Places': {
    icon: <MapPin className="w-5 h-5" />,
    bg: 'bg-green-50',
  },
  'Local Transport': {
    icon: <Bus className="w-5 h-5" />,
    bg: 'bg-yellow-50',
  },
} as const

type CategoryKey = keyof typeof CATEGORY_CONFIG

function PreferencesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout, token } = useAuthStore()
  const [categories, setCategories] = useState<CategorySection[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Restaurants', 'Hotels', 'Recreation Places', 'Local Transport'])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripData, setTripData] = useState<any>(null)
  const [itineraryId, setItineraryId] = useState<string | null>(null)
  const [isCreatingTour, setIsCreatingTour] = useState(false)
  const [isEditingExistingDay, setIsEditingExistingDay] = useState(false)
  const [preferencesData, setPreferencesData] = useState<PreferencesData>({
    like_hotel: [],
    like_restaurant: [],
    like_attraction: [],
    like_local_transport: [],
    dislike_hotel: [],
    dislike_restaurant: [],
    dislike_attraction: [],
    dislike_local_transport: [],
  })

  const API_BASE = 'http://localhost:5000/api'

  // API helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'API Error')
    return data
  }

  // Load trip data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTripData = localStorage.getItem('currentTripData')
      if (savedTripData) {
        try {
          setTripData(JSON.parse(savedTripData))
        } catch (e) {
          console.error('Failed to parse trip data:', e)
        }
      }
    }
  }, [])

  // Create base itinerary if not exists
  useEffect(() => {
    const createBaseItinerary = async () => {
      const urlItineraryId = searchParams.get('itineraryId')

      // If itineraryId already in URL, use it
      if (urlItineraryId) {
        setItineraryId(urlItineraryId)
        return
      }

      // Need user, token, and tripData to create
      if (!user || !token || !tripData?.destination_city_id) {
        return
      }

      // Avoid creating duplicate
      if (isCreatingTour || itineraryId) {
        return
      }

      try {
        setIsCreatingTour(true)
        setError(null)

        // Calculate trip duration - handle various date formats
        let durationDays = 3 // default
        
        // Helper to parse date string (handles DD/MM/YYYY or YYYY-MM-DD)
        const parseDate = (dateStr: string): Date | null => {
          if (!dateStr) return null
          
          // Try DD/MM/YYYY format
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/')
            if (parts.length === 3) {
              const [day, month, year] = parts
              return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
            }
          }
          
          // Try standard format (YYYY-MM-DD or ISO)
          const date = new Date(dateStr)
          return isNaN(date.getTime()) ? null : date
        }

        if (tripData.departureDate && tripData.returnDate) {
          const start = parseDate(tripData.departureDate)
          const end = parseDate(tripData.returnDate)
          
          console.log('Parsing dates:', {
            departureDate: tripData.departureDate,
            returnDate: tripData.returnDate,
            parsedStart: start,
            parsedEnd: end
          })
          
          if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end.getTime() - start.getTime())
            durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
            // Ensure at least 1 day
            if (durationDays < 1) durationDays = 1
          }
        }
        
        // Also check tripData.days if available
        if (tripData.days && typeof tripData.days === 'number' && tripData.days > 0) {
          durationDays = tripData.days
        }

        console.log('Creating itinerary with duration:', durationDays)

        // Format start_date to YYYY-MM-DD for backend
        let startDateStr = new Date().toISOString().split('T')[0]
        if (tripData.departureDate) {
          const parsed = parseDate(tripData.departureDate)
          if (parsed) {
            startDateStr = parsed.toISOString().split('T')[0]
          }
        }

        // Create base tour
        const result = await apiCall('/itinerary/create', {
          method: 'POST',
          body: JSON.stringify({
            city_id: tripData.destination_city_id,
            trip_duration_days: durationDays,
            start_date: startDateStr,
            guest_count: (tripData.adults || 2) + (tripData.children || 0),
            budget: tripData.budget || 1000
          })
        })
        
        console.log('Itinerary created:', result)

        const newItineraryId = result.itinerary_id
        setItineraryId(newItineraryId)

        // Update URL with itineraryId
        const cityId = searchParams.get('cityId')
        const params = new URLSearchParams()
        if (cityId) params.set('cityId', cityId)
        params.set('itineraryId', newItineraryId)
        router.replace(`/preferences?${params.toString()}`)

        console.log('Base itinerary created:', newItineraryId)
      } catch (err: any) {
        console.error('Failed to create base itinerary:', err)
        setError(err.message || 'Failed to create base itinerary')
      } finally {
        setIsCreatingTour(false)
      }
    }

    createBaseItinerary()
  }, [user, token, tripData, searchParams, itineraryId, isCreatingTour])

  // Check if editing an existing day
  useEffect(() => {
    const checkDayExists = async () => {
      const editDay = searchParams.get('editDay')
      const urlItineraryId = searchParams.get('itineraryId') || itineraryId

      if (!editDay || !urlItineraryId || !token) {
        setIsEditingExistingDay(false)
        return
      }

      try {
        const response = await apiCall(`/itinerary/${urlItineraryId}`)
        const dayNumber = parseInt(editDay)
        const dayExists = response.daily_itinerary?.some((d: any) => d.day_number === dayNumber) || false
        setIsEditingExistingDay(dayExists)
        console.log(`Day ${dayNumber} exists: ${dayExists}`)
      } catch (err) {
        console.error('Error checking day existence:', err)
        setIsEditingExistingDay(false)
      }
    }

    checkDayExists()
  }, [searchParams, itineraryId, token])

  // Fetch places from API based on city ID
  useEffect(() => {
    const fetchPlaces = async () => {
      const cityId = searchParams.get('cityId')

      if (!cityId) {
        setError('No city ID provided')
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        const data = await PlacesService.getPlacesByCityId(cityId)

        // Transform API response to CategorySection format
        const transformedCategories: CategorySection[] = []

        // Hotels
        if (data.hotel && data.hotel.length > 0) {
          transformedCategories.push({
            title: 'Hotels',
            description: 'Select your preferred accommodations and skip the ones that don\'t match your style.',
            icon: <Hotel className="w-5 h-5" />,
            bgColor: 'bg-blue-50',
            items: data.hotel.map((place: Place) => ({
              id: place.id,
              place_id: place.id,
              name: place.displayName_text,
              category: 'Hotel',
              rating: place.rating,
              reviews: place.userRatingCount,
              price: `$${place.avg_price}`,
              liked: false,
              skipped: false,
            }))
          })
        }

        // Restaurants
        if (data.restaurant && data.restaurant.length > 0) {
          transformedCategories.push({
            title: 'Restaurants',
            description: 'Interact to highlight favourites and remove options that do not resonate.',
            icon: <Utensils className="w-5 h-5" />,
            bgColor: 'bg-red-50',
            items: data.restaurant.map((place: Place) => ({
              id: place.id,
              place_id: place.id,
              name: place.displayName_text,
              category: 'Restaurant',
              rating: place.rating,
              reviews: place.userRatingCount,
              price: `$${place.avg_price}`,
              liked: false,
              skipped: false,
            }))
          })
        }

        // Attractions (Recreation Places)
        if (data.attraction && data.attraction.length > 0) {
          transformedCategories.push({
            title: 'Recreation Places',
            description: 'Choose activities and attractions that interest you the most.',
            icon: <MapPin className="w-5 h-5" />,
            bgColor: 'bg-green-50',
            items: data.attraction.map((place: Place) => ({
              id: place.id,
              place_id: place.id,
              name: place.displayName_text,
              category: 'Attraction',
              rating: place.rating,
              reviews: place.userRatingCount,
              price: `$${place.avg_price}`,
              liked: false,
              skipped: false,
            }))
          })
        }

        setCategories(transformedCategories)
      } catch (err: any) {
        console.error('Failed to fetch places:', err)
        setError(err.message || 'Failed to load places')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlaces()
  }, [searchParams])



  // Load saved preferences when categories are loaded
  useEffect(() => {
    const loadSavedPreferences = async () => {
      const cityId = searchParams.get('cityId')

      // Only load if we have user, cityId, and categories are loaded
      if (!user?.id || !cityId || categories.length === 0) {
        return
      }

      try {
        console.log('Loading saved preferences for user:', user.id, 'city:', cityId)
        const savedPrefs = await PlacesService.getPreferences(user.id, cityId)

        // Check if there are any saved preferences
        const hasPreferences =
          savedPrefs.like_hotel.length > 0 ||
          savedPrefs.like_restaurant.length > 0 ||
          savedPrefs.like_attraction.length > 0 ||
          savedPrefs.dislike_hotel.length > 0 ||
          savedPrefs.dislike_restaurant.length > 0 ||
          savedPrefs.dislike_attraction.length > 0

        if (!hasPreferences) {
          console.log('No saved preferences found')
          return
        }

        console.log('Applying saved preferences:', savedPrefs)

        // Apply saved preferences to categories
        setCategories((prevCategories) =>
          prevCategories.map((category) => {
            if (category.title === 'Hotels') {
              return {
                ...category,
                items: category.items.map((item) => ({
                  ...item,
                  liked: savedPrefs.like_hotel.includes(item.id.toString()),
                  skipped: savedPrefs.dislike_hotel.includes(item.id.toString()),
                })),
              }
            } else if (category.title === 'Restaurants') {
              return {
                ...category,
                items: category.items.map((item) => ({
                  ...item,
                  liked: savedPrefs.like_restaurant.includes(item.id.toString()),
                  skipped: savedPrefs.dislike_restaurant.includes(item.id.toString()),
                })),
              }
            } else if (category.title === 'Recreation Places') {
              return {
                ...category,
                items: category.items.map((item) => ({
                  ...item,
                  liked: savedPrefs.like_attraction.includes(item.id.toString()),
                  skipped: savedPrefs.dislike_attraction.includes(item.id.toString()),
                })),
              }
            }
            return category
          })
        )

        // Update preferencesData state
        setPreferencesData(savedPrefs)

        console.log('Preferences applied successfully')
      } catch (error) {
        console.error('Error loading saved preferences:', error)
        // Don't show error to user, just continue with empty preferences
      }
    }

    loadSavedPreferences()
  }, [categories.length, user?.id, searchParams])

  // Calculate stats
  const likedCount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.items.filter((item) => item.liked).length, 0)
  }, [categories])

  const skippedCount = useMemo(() => {
    return categories.reduce((sum, cat) => sum + cat.items.filter((item) => item.skipped).length, 0)
  }, [categories])

  // Toggle category expansion
  const toggleCategory = (categoryTitle: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryTitle)
        ? prev.filter((title) => title !== categoryTitle)
        : [...prev, categoryTitle]
    )
  }

  // Handle like/skip
  const handleLike = (categoryTitle: string, itemId: string | number) => {
    const id = itemId.toString()

    // Update preferencesData first
    setPreferencesData((prev) => {
      let updatedPrefs = { ...prev }

      if (categoryTitle === 'Hotels') {
        const exists = prev.like_hotel.includes(id)
        updatedPrefs.like_hotel = exists
          ? prev.like_hotel.filter((x) => x !== id)
          : [...prev.like_hotel, id]
        // Remove from dislike if adding to like
        if (!exists) {
          updatedPrefs.dislike_hotel = prev.dislike_hotel.filter((x) => x !== id)
        }
      } else if (categoryTitle === 'Restaurants') {
        const exists = prev.like_restaurant.includes(id)
        updatedPrefs.like_restaurant = exists
          ? prev.like_restaurant.filter((x) => x !== id)
          : [...prev.like_restaurant, id]
        // Remove from dislike if adding to like
        if (!exists) {
          updatedPrefs.dislike_restaurant = prev.dislike_restaurant.filter((x) => x !== id)
        }
      } else if (categoryTitle === 'Recreation Places') {
        const exists = prev.like_attraction.includes(id)
        updatedPrefs.like_attraction = exists
          ? prev.like_attraction.filter((x) => x !== id)
          : [...prev.like_attraction, id]
        // Remove from dislike if adding to like
        if (!exists) {
          updatedPrefs.dislike_attraction = prev.dislike_attraction.filter((x) => x !== id)
        }
      }
      return updatedPrefs
    })

    // Update categories UI
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.title === categoryTitle) {
          return {
            ...cat,
            items: cat.items.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  liked: !item.liked,
                  skipped: false,
                }
              }
              return item
            }),
          }
        }
        return cat
      })
    )
  }

  const handleSkip = (categoryTitle: string, itemId: string | number) => {
    const id = itemId.toString()

    // Update preferencesData first
    setPreferencesData((prev) => {
      let updatedPrefs = { ...prev }

      if (categoryTitle === 'Hotels') {
        const exists = prev.dislike_hotel.includes(id)
        updatedPrefs.dislike_hotel = exists
          ? prev.dislike_hotel.filter((x) => x !== id)
          : [...prev.dislike_hotel, id]
        // Remove from like if adding to dislike
        if (!exists) {
          updatedPrefs.like_hotel = prev.like_hotel.filter((x) => x !== id)
        }
      } else if (categoryTitle === 'Restaurants') {
        const exists = prev.dislike_restaurant.includes(id)
        updatedPrefs.dislike_restaurant = exists
          ? prev.dislike_restaurant.filter((x) => x !== id)
          : [...prev.dislike_restaurant, id]
        // Remove from like if adding to dislike
        if (!exists) {
          updatedPrefs.like_restaurant = prev.like_restaurant.filter((x) => x !== id)
        }
      } else if (categoryTitle === 'Recreation Places') {
        const exists = prev.dislike_attraction.includes(id)
        updatedPrefs.dislike_attraction = exists
          ? prev.dislike_attraction.filter((x) => x !== id)
          : [...prev.dislike_attraction, id]
        // Remove from like if adding to dislike
        if (!exists) {
          updatedPrefs.like_attraction = prev.like_attraction.filter((x) => x !== id)
        }
      }
      return updatedPrefs
    })

    // Update categories UI
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.title === categoryTitle) {
          return {
            ...cat,
            items: cat.items.map((item) => {
              if (item.id === itemId) {
                return {
                  ...item,
                  liked: false,
                  skipped: !item.skipped,
                }
              }
              return item
            }),
          }
        }
        return cat
      })
    )
  }

  const handleContinue = async () => {
    // Validate user and itinerary
    if (!user?.id) {
      setError('User not logged in')
      return
    }

    if (!itineraryId) {
      setError('No itinerary created. Please wait...')
      return
    }

    if (!tripData?.destination_city_id) {
      setError('No destination city selected')
      return
    }

    // Calculate preferences from current categories state
    const calculatedPrefs: PreferencesData = {
      like_hotel: [],
      like_restaurant: [],
      like_attraction: [],
      like_local_transport: [],
      dislike_hotel: [],
      dislike_restaurant: [],
      dislike_attraction: [],
      dislike_local_transport: [],
    }

    categories.forEach((category) => {
      category.items.forEach((item) => {
        const id = item.id.toString()

        if (category.title === 'Hotels') {
          if (item.liked) calculatedPrefs.like_hotel.push(id)
          if (item.skipped) calculatedPrefs.dislike_hotel.push(id)
        } else if (category.title === 'Restaurants') {
          if (item.liked) calculatedPrefs.like_restaurant.push(id)
          if (item.skipped) calculatedPrefs.dislike_restaurant.push(id)
        } else if (category.title === 'Recreation Places') {
          if (item.liked) calculatedPrefs.like_attraction.push(id)
          if (item.skipped) calculatedPrefs.dislike_attraction.push(id)
        }
      })
    })

    try {
      setError(null)
      setIsLoading(true)

      // Save preferences
      await PlacesService.set_Preferences(
        user.id,
        tripData.destination_city_id,
        calculatedPrefs
      )

      console.log('Preferences saved successfully')

      // Check if we're in edit mode (editing a specific day)
      const editDay = searchParams.get('editDay')
      
      if (editDay) {
        // Redirect back to itinerary with regenerateDay param
        console.log(`Edit mode: redirecting to regenerate day ${editDay}`)
        router.push(`/itinerary?itineraryId=${itineraryId}&regenerateDay=${editDay}`)
      } else {
        // Normal flow: redirect to itinerary page
        router.push(`/itinerary?itineraryId=${itineraryId}`)
      }


    } catch (error: any) {
      console.error('Error setting preferences:', error)
      setError(error.message || 'Failed to set preferences')
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    window.history.back()
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7]">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Main page scrollbar */
          * {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 229, 180, 0.4) rgba(9, 19, 26, 0.3);
          }
          
          *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          *::-webkit-scrollbar-track {
            background: rgba(9, 19, 26, 0.3);
            border-radius: 12px;
            margin: 4px 0;
          }
          
          *::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.5), rgba(255, 213, 158, 0.4));
            border-radius: 12px;
            border: 2px solid rgba(9, 19, 26, 0.3);
            transition: all 0.3s ease;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.7), rgba(255, 213, 158, 0.6));
            border-color: rgba(255, 229, 180, 0.2);
          }
          
          *::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.9), rgba(255, 213, 158, 0.8));
          }
          
          /* Items container specific scrollbar */
          .dashboard-preferences__items-container::-webkit-scrollbar {
            width: 8px;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-track {
            background: rgba(12, 26, 34, 0.5);
            border-radius: 10px;
            margin: 8px 0;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.4), rgba(255, 213, 158, 0.3));
            border-radius: 10px;
            border: 2px solid rgba(12, 26, 34, 0.5);
            transition: all 0.3s ease;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.6), rgba(255, 213, 158, 0.5));
            transform: scaleX(1.1);
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb:active {
            background: linear-gradient(180deg, rgba(255, 229, 180, 0.8), rgba(255, 213, 158, 0.7));
          }
        `
      }} />

      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0B1217] via-[#0B1217]/40 to-transparent" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#7D837A]">
              VietJourney
            </p>
            <p className="text-xl font-semibold text-[#F3F0E9]">
              Mapping Vietnam experiences
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Home
            </Link>
            <Link href="/dashboard" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Dashboard
            </Link>
            <Link href="/tours" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Personalities
            </Link>
            <Link href="#" className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]">
              Contact
            </Link>
            <span className="mx-2 h-4 w-px bg-white/20"></span>

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full bg-white/10 px-4 py-2 text-[#F3F0E9] transition hover:bg-white/20 flex items-center gap-2">
                  <span>{user?.role === 'admin' ? 'ADMIN' : user?.fullname || user?.email || 'USER'}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#1A1D1C]/95 backdrop-blur-lg border-white/10">
                <DropdownMenuLabel className="text-[#F3F0E9]">
                  <div className="flex flex-col">
                    <span className="font-medium">{user?.fullname || 'User'}</span>
                    <span className="text-xs text-[#A5ABA3]">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  onClick={() => router.push('/profile')}
                  className="text-[#F3F0E9] hover:bg-white/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profile
                </DropdownMenuItem>

                <AdminOnly>
                  <DropdownMenuItem
                    onClick={() => router.push('/admin')}
                    className="text-[#FFE5B4] hover:bg-white/10 cursor-pointer"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Admin Panel
                  </DropdownMenuItem>
                </AdminOnly>

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  onClick={async () => {
                    await logout()
                    router.push('/login')
                  }}
                  className="text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 pb-8">
        <section id="dashboard-preferences" className="preferences">
          <div className="dashboard-preferences__halo" aria-hidden="true" />
          <div className="dashboard-preferences__inner">
            <header className="dashboard-preferences__header">
              <div className="dashboard-preferences__chip">
                <span>
                  {searchParams.get('editDay') 
                    ? (isEditingExistingDay 
                        ? `Editing Day ${searchParams.get('editDay')}` 
                        : `Planning Day ${searchParams.get('editDay')}`
                      )
                    : 'Refine preferences'
                  }
                </span>
              </div>
              <div className="dashboard-preferences__titles">
                <h2>
                  {searchParams.get('editDay') 
                    ? (isEditingExistingDay
                        ? `Update preferences for Day ${searchParams.get('editDay')}`
                        : `Plan your Day ${searchParams.get('editDay')} itinerary`
                      )
                    : 'Curate the experiences that fit your travel style'
                  }
                </h2>
                <p>
                  {searchParams.get('editDay')
                    ? (isEditingExistingDay
                        ? 'Change your selections below, then click Continue to regenerate this day with your new preferences.'
                        : 'Select your preferred places below, then click Continue to generate this day with your selections.'
                      )
                    : 'Evaluate restaurants, hotels, activities and transfers so the system can tailor the itinerary around your preferences.'
                  }
                </p>
              </div>
            </header>

            <div className="dashboard-preferences__grid">
              {/* Sidebar */}
              <aside className="dashboard-preferences__summary">
                <div className="dashboard-preferences__summary-card">
                  <div className="dashboard-preferences__summary-header">
                    <span>Trip overview</span>
                    <button type="button" onClick={handleBack}>
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                  </div>

                  <ul>
                    <li>
                      <span>Destination</span>
                      <strong>{tripData?.destination || 'N/A'}</strong>
                    </li>
                    <li>
                      <span>Dates</span>
                      <strong>{tripData?.departureDate && tripData?.returnDate ? `${tripData.departureDate} — ${tripData.returnDate}` : 'N/A'}</strong>
                    </li>
                    <li>
                      <span>Guests</span>
                      <strong>{tripData ? (tripData.adults + tripData.children) : 0}</strong>
                    </li>
                    <li>
                      <span>Budget</span>
                      <strong>${tripData?.budget?.toLocaleString() || '0'}</strong>
                    </li>
                  </ul>

                  <div className="dashboard-preferences__summary-stat">
                    <div>
                      <span>Likes</span>
                      <strong>{likedCount}</strong>
                    </div>
                    <div>
                      <span>Skipped</span>
                      <strong>{skippedCount}</strong>
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main content */}
              <main className="dashboard-preferences__content">
                {error ? (
                  <div className="dashboard-preferences__loading">
                    <X className="w-8 h-8 text-red-400" />
                    <span className="text-red-400">{error}</span>
                    <button
                      onClick={() => window.history.back()}
                      className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
                    >
                      Go Back
                    </button>
                  </div>
                ) : isLoading ? (
                  <div className="dashboard-preferences__loading">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span>Loading preferences...</span>
                  </div>
                ) : (
                  <>
                    <div className="dashboard-preferences__categories">
                      {categories.map((category) => {
                        const isExpanded = expandedCategories.includes(category.title)
                        return (
                          <section key={category.title} className="dashboard-preferences__category-card">
                            <header
                              className="dashboard-preferences__category-header-new"
                              onClick={() => toggleCategory(category.title)}
                            >
                              <div className="dashboard-preferences__category-icon">
                                {category.icon}
                              </div>
                              <div className="dashboard-preferences__category-info">
                                <h3>{category.title}</h3>
                                <p>{category.description}</p>
                              </div>
                              <button
                                type="button"
                                className="dashboard-preferences__category-toggle"
                                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5" />
                                ) : (
                                  <ChevronDown className="w-5 h-5" />
                                )}
                              </button>
                            </header>

                            {isExpanded && (
                              <div
                                className="dashboard-preferences__items-container"
                                style={{
                                  maxHeight: '420px',
                                  overflowY: 'auto',
                                  scrollbarWidth: 'thin',
                                  scrollbarColor: 'rgba(255, 229, 180, 0.3) rgba(12, 26, 34, 0.4)'
                                }}
                              >
                                {category.items.map((item) => (
                                  <div key={item.id} className="dashboard-preferences__item-card">
                                    <div className="dashboard-preferences__item-content">
                                      <h4 className="dashboard-preferences__item-name">{item.name}</h4>
                                      <p className="dashboard-preferences__item-category">{item.category}</p>

                                      <div className="dashboard-preferences__item-details">
                                        <div className="dashboard-preferences__item-rating">
                                          <Star className="w-4 h-4" fill="currentColor" />
                                          <span>{item.rating}</span>
                                          <span className="dashboard-preferences__item-reviews">
                                            {item.reviews.toLocaleString()} reviews
                                          </span>
                                        </div>
                                        <span className="dashboard-preferences__item-price">{item.price}</span>
                                      </div>
                                    </div>

                                    <div className="dashboard-preferences__item-actions-new">
                                      <button
                                        type="button"
                                        onClick={() => handleLike(category.title, item.id)}
                                        className={`dashboard-preferences__action-btn dashboard-preferences__action-btn--like ${item.liked ? 'is-active' : ''
                                          }`}
                                      >
                                        <ThumbsUp className="w-4 h-4" />
                                        <span>Like</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSkip(category.title, item.id)}
                                        className={`dashboard-preferences__action-btn dashboard-preferences__action-btn--skip ${item.skipped ? 'is-active' : ''
                                          }`}
                                      >
                                        <X className="w-4 h-4" />
                                        <span>Skip</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        )
                      })}
                    </div>

                    <footer className="dashboard-preferences__footer flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="dashboard-preferences__continue"
                        disabled={isLoading}
                      >
                        <span>
                          {searchParams.get('editDay') 
                            ? (isEditingExistingDay
                                ? `Regenerate Day ${searchParams.get('editDay')}`
                                : `Generate Day ${searchParams.get('editDay')}`
                              )
                            : 'Continue'
                          }
                        </span>
                        <Check className="w-4 h-4" />
                      </button>
                    </footer>
                  </>
                )}
              </main>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 bg-[#061017]/80 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#7D837A]">
              VietJourney
            </p>
            <h3 className="mb-4 text-xl font-semibold text-white">
              Connect and discover experiences over land
            </h3>
            <p className="mb-2 text-sm text-[#D0D7D8]">
              43 Building, 348 Arau They Street,
            </p>
            <p className="mb-2 text-sm text-[#D0D7D8]">
              Can Giay District, Ha Noi, Vietnam
            </p>
            <p className="text-sm text-[#D0D7D8]">
              help@vietjourneycommander.com
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-[#D0D7D8]">
                <li><a href="#" className="hover:text-[#FFE5B4]">Tailored experiences</a></li>
                <li><a href="#" className="hover:text-[#FFE5B4]">Signature journeys</a></li>
                <li><a href="#" className="hover:text-[#FFE5B4]">Themed escapes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm text-[#D0D7D8]">
                <li><a href="#" className="hover:text-[#FFE5B4]">Help centre</a></li>
                <li><a href="#" className="hover:text-[#FFE5B4]">Terms of privacy</a></li>
                <li><a href="#" className="hover:text-[#FFE5B4]">Legal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Stay looped</h4>
              <p className="mb-3 text-sm text-[#D0D7D8]">
                Receive curated travel moments straight to your inbox
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email..."
                  className="h-10 flex-1 rounded-lg border border-white/20 bg-[rgba(7,18,26,0.92)] px-3 text-sm text-white placeholder:text-[#B6C2C6] focus:border-[#FFE5B4] focus:outline-none"
                />
                <button className="rounded-lg bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] px-4 text-sm font-semibold text-[#2B1200] transition hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-6 pt-8 text-center text-sm text-[#7D837A]">
          <p>© 2025 VietJourney. All rights reserved</p>
          <p className="mt-2">Design aligned with the Welcome experiences.</p>
        </div>
      </footer>
    </div>
  )
}

export default function PreferencesPage() {
  return (
    <AuthGuard>
      <PreferencesContent />
    </AuthGuard>
  )
}

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
import { ItineraryService } from "@/services/itinerary.service"
import { Place, PreferencesData } from "@/types/domain"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("PreferencesPage")
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

  // Define transport modes matching backend configuration
  const TRANSPORT_MODES = [
    {
      id: 'walking',
      name: 'Walking',
      icon: '🚶',
      maxKm: 1.5,
      speedKmh: 5,
      costPerKm: 0,
      description: 'Up to 1.5km, Free'
    },
    {
      id: 'motorbike',
      name: 'Motorbike',
      icon: '🏍️',
      maxKm: 30,
      speedKmh: 35,
      costPerKm: 0.4,
      description: 'Up to 30km, $0.4/km'
    },
    {
      id: 'taxi',
      name: 'Taxi',
      icon: '🚕',
      maxKm: 100,
      speedKmh: 30,
      costPerKm: 0.75,
      description: 'Up to 100km, $0.75/km'
    }
  ]

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

        // Format start_date to YYYY-MM-DD for backend (dùng local date để tránh lệch múi giờ)
        const toYYYYMMDD = (d: Date) => {
          const y = d.getFullYear()
          const m = String(d.getMonth() + 1).padStart(2, '0')
          const day = String(d.getDate()).padStart(2, '0')
          return `${y}-${m}-${day}`
        }
        const now = new Date()
        let startDateStr = toYYYYMMDD(now)
        const departureDateSource = tripData.departureDate?.trim() || (tripData as any).flight_departure_date?.trim() || ''
        if (departureDateSource) {
          const parsed = parseDate(departureDateSource)
          if (parsed && !isNaN(parsed.getTime())) {
            startDateStr = toYYYYMMDD(parsed)
          }
        }

        // Create base tour using ItineraryService
        const result = await ItineraryService.createItinerary({
          city_id: tripData.destination_city_id || tripData.cityId,
          city_name: tripData.destination,
          name: tripData.departure +" to " +tripData.destination,
          trip_duration_days: durationDays,
          start_date: startDateStr,
          guest_count: (tripData.adults || 2) + (tripData.children || 0),
          budget: tripData.budget || 1000,
          ...(tripData.book_flight === true && tripData.flights ? {
            book_flight: true,
            flights: tripData.flights
          } : {})
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
        const response = await ItineraryService.getItinerary(urlItineraryId)
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

        // Add Local Transport section with 3 transport modes
        transformedCategories.push({
          title: 'Local Transport',
          description: 'Select your preferred transportation methods for getting around.',
          icon: <Bus className="w-5 h-5" />,
          bgColor: 'bg-yellow-50',
          items: TRANSPORT_MODES.map((transport) => ({
            id: transport.id,
            place_id: transport.id,
            name: transport.name,
            category: 'Transport',
            rating: 0, // Not applicable for transport
            reviews: 0, // Not applicable for transport
            price: transport.description,
            info: `${transport.icon} Speed: ${transport.speedKmh}km/h`,
            liked: false,
            skipped: false,
          }))
        })

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
            } else if (category.title === 'Local Transport') {
              return {
                ...category,
                items: category.items.map((item) => ({
                  ...item,
                  liked: savedPrefs.like_local_transport.includes(item.id.toString()),
                  skipped: savedPrefs.dislike_local_transport.includes(item.id.toString()),
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
      } else if (categoryTitle === 'Local Transport') {
        const exists = prev.like_local_transport.includes(id)
        updatedPrefs.like_local_transport = exists
          ? prev.like_local_transport.filter((x) => x !== id)
          : [...prev.like_local_transport, id]
        // Remove from dislike if adding to like
        if (!exists) {
          updatedPrefs.dislike_local_transport = prev.dislike_local_transport.filter((x) => x !== id)
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
      } else if (categoryTitle === 'Local Transport') {
        const exists = prev.dislike_local_transport.includes(id)
        updatedPrefs.dislike_local_transport = exists
          ? prev.dislike_local_transport.filter((x) => x !== id)
          : [...prev.dislike_local_transport, id]
        // Remove from like if adding to dislike
        if (!exists) {
          updatedPrefs.like_local_transport = prev.like_local_transport.filter((x) => x !== id)
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
        } else if (category.title === 'Local Transport') {
          // Collect transport preferences for backend use (not saved to DB)
          if (item.liked) calculatedPrefs.like_local_transport.push(id)
          if (item.skipped) calculatedPrefs.dislike_local_transport.push(id)
        }
      })
    })

    try {
      setError(null)
      setIsLoading(true)

      // Save only hotel/restaurant/attraction preferences to database
      // Transport preferences are NOT persisted
      const prefsToSave: PreferencesData = {
        like_hotel: calculatedPrefs.like_hotel,
        like_restaurant: calculatedPrefs.like_restaurant,
        like_attraction: calculatedPrefs.like_attraction,
        like_local_transport: [], // Don't save transport preferences
        dislike_hotel: calculatedPrefs.dislike_hotel,
        dislike_restaurant: calculatedPrefs.dislike_restaurant,
        dislike_attraction: calculatedPrefs.dislike_attraction,
        dislike_local_transport: [], // Don't save transport preferences
      }

      await PlacesService.set_Preferences(
        user.id,
        tripData.destination_city_id,
        prefsToSave
      )

      console.log('Preferences saved successfully (excluding transport)')
      console.log('Transport preferences collected but not saved:', {
        liked: calculatedPrefs.like_local_transport,
        disliked: calculatedPrefs.dislike_local_transport
      })

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
    <div className="relative min-h-screen overflow-hidden bg-[#F0FDFA] text-[#3F3F46]">
      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          /* Main page scrollbar */
          * {
            scrollbar-width: thin;
            scrollbar-color: #5FCBC4 #E4E4E7;
          }
          
          *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          *::-webkit-scrollbar-track {
            background: #E4E4E7;
            border-radius: 12px;
            margin: 4px 0;
          }
          
          *::-webkit-scrollbar-thumb {
            background: #5FCBC4;
            border-radius: 12px;
            border: 2px solid #E4E4E7;
            transition: all 0.3s ease;
          }
          
          *::-webkit-scrollbar-thumb:hover {
            background: #4AB8B0;
            border-color: #5FCBC4;
          }
          
          *::-webkit-scrollbar-thumb:active {
            background: #4AB8B0;
          }
          
          /* Items container specific scrollbar */
          .dashboard-preferences__items-container::-webkit-scrollbar {
            width: 8px;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-track {
            background: #E4E4E7;
            border-radius: 10px;
            margin: 8px 0;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb {
            background: #5FCBC4;
            border-radius: 10px;
            border: 2px solid #E4E4E7;
            transition: all 0.3s ease;
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb:hover {
            background: #4AB8B0;
            transform: scaleX(1.1);
          }
          
          .dashboard-preferences__items-container::-webkit-scrollbar-thumb:active {
            background: #4AB8B0;
          }
        `
      }} />

      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#F0FDFA]" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#A1A1AA]">
              {t("brand")}
            </p>
            <p className="text-xl font-semibold text-[#0F4C5C]">
              {t("tagline")}
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C]">
              {t("home")}
            </Link>
            <Link href="/planner" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C]">
              {t("dashboard")}
            </Link>
            <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C]">
              {t("tours")}
            </Link>
            <Link href="#" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C]">
              {t("contact")}
            </Link>
            <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>

            {/* User Menu Dropdown */}
            <UserMenu />
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
                      className="mt-4 rounded-lg border border-[#E4E4E7] bg-white px-4 py-2 text-sm text-[#3F3F46] hover:border-[#5FCBC4] hover:bg-[#CCFBF1] hover:text-[#0F4C5C] transition-colors"
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
                                  scrollbarColor: 'rgba(95, 203, 196, 0.3) rgba(12, 26, 34, 0.4)'
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
      <Footer />
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

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
  const { user, logout } = useAuthStore()
  const [categories, setCategories] = useState<CategorySection[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Restaurants', 'Hotels', 'Recreation Places', 'Local Transport'])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tripData, setTripData] = useState<any>(null)
  const [preferencesData, setPreferencesData] = useState<PreferencesData | null>(null)
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

  const handleContinue = () => {
    console.log('Continue to next step', {
      likedCount,
      skippedCount,
    })
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
                <span>Refine preferences</span>
              </div>
              <div className="dashboard-preferences__titles">
                <h2>Curate the experiences that fit your travel style</h2>
                <p>
                  Evaluate restaurants, hotels, activities and transfers so the system can tailor the itinerary around your preferences.
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

                    <footer className="dashboard-preferences__footer">
                      <p>
                        {likedCount + skippedCount === 0
                          ? 'Start selecting your preferences to personalize your itinerary'
                          : `You've selected ${likedCount} likes and ${skippedCount} skipped`}
                      </p>
                      <button
                        type="button"
                        onClick={handleContinue}
                        className="dashboard-preferences__continue"
                        disabled={isLoading}
                      >
                        <span>Continue</span>
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

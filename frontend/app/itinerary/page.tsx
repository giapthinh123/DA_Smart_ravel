"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthStore } from "@/store/useAuthStore"
import { AuthGuard } from "@/components/auth-guard"
import {
    ItineraryService,
    Itinerary,
    DayItinerary,
    Block,
    GenerateDayResponse
} from "@/services/itinerary.service"
import { PlacesService } from "@/services/places.service"
import {
    Loader2,
    MapPin,
    Calendar,
    Users,
    DollarSign,
    ChevronLeft,
    ChevronRight,
    Star,
    Clock,
    Navigation,
    Home,
    Download,
    Share2,
    CreditCard
} from "lucide-react"

// Types for place details
interface PlaceDetails {
    displayName_text: string
    rating: number
    userRatingCount: number
    avg_price: number
    editorialSummary_text?: string
    image_url?: string[]
    reviews?: Array<{
        rating: number
        text: { text: string }
        relativePublishTimeDescription: string
        authorAttribution: { displayName: string }
    }>
}

// Helper functions
const getBlockColor = (blockType: string): string => {
    const colors: Record<string, string> = {
        breakfast: "from-amber-500/30 to-orange-500/20 border-amber-400/40",
        morning_activity: "from-sky-500/30 to-blue-500/20 border-sky-400/40",
        lunch: "from-emerald-500/30 to-green-500/20 border-emerald-400/40",
        afternoon_activity: "from-violet-500/30 to-purple-500/20 border-violet-400/40",
        dinner: "from-rose-500/30 to-pink-500/20 border-rose-400/40",
        hotel: "from-slate-500/30 to-gray-500/20 border-slate-400/40"
    }
    return colors[blockType] || "from-white/10 to-white/5 border-white/20"
}

const getBlockIcon = (blockType: string): string => {
    const icons: Record<string, string> = {
        breakfast: "🌅",
        morning_activity: "🎯",
        lunch: "🍽️",
        afternoon_activity: "🎭",
        dinner: "🌙",
        hotel: "🏨"
    }
    return icons[blockType] || "📍"
}

const getBlockLabel = (blockType: string): string => {
    const labels: Record<string, string> = {
        breakfast: "Breakfast",
        morning_activity: "Morning Activity",
        lunch: "Lunch",
        afternoon_activity: "Afternoon Activity",
        dinner: "Dinner",
        hotel: "Accommodation"
    }
    return labels[blockType] || blockType
}

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    })
}

const formatShortDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
    })
}

function ItineraryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, logout, token } = useAuthStore()

    // State
    const [itinerary, setItinerary] = useState<Itinerary | null>(null)
    const [selectedDay, setSelectedDay] = useState(1)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatingDay, setGeneratingDay] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
    const [placeDetails, setPlaceDetails] = useState<Record<string, PlaceDetails>>({})
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
    const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({})

    // Ref to prevent double generation from React Strict Mode
    const isGeneratingRef = useRef(false)
    const hasLoadedRef = useRef(false)

    // Get params from URL
    const itineraryId = searchParams.get("itineraryId") || ""
    const regenerateDayParam = searchParams.get("regenerateDay")  // Day to regenerate after edit

    // Regenerate a specific day (delete then generate)
    const regenerateDay = async (itinId: string, dayNumber: number) => {
        if (isGeneratingRef.current) {
            console.log(`[Regenerate] Already generating, skipping`)
            return false
        }

        isGeneratingRef.current = true
        console.log(`[Regenerate] Regenerating day ${dayNumber} for itinerary ${itinId}`)

        setGeneratingDay(dayNumber)
        setError(null)

        try {
            const result = await ItineraryService.regenerateDay(itinId, dayNumber)

            console.log(`[Regenerate] Day ${dayNumber} regenerated:`, result)

            // Update itinerary with regenerated day
            setItinerary(prev => {
                if (!prev) return prev

                const existingDayIndex = prev.daily_itinerary.findIndex(d => d.day_number === dayNumber)
                let newDailyItinerary = [...prev.daily_itinerary]

                if (existingDayIndex >= 0) {
                    newDailyItinerary[existingDayIndex] = result.day
                } else {
                    newDailyItinerary.push(result.day)
                    newDailyItinerary.sort((a, b) => a.day_number - b.day_number)
                }

                return {
                    ...prev,
                    daily_itinerary: newDailyItinerary,
                    status: result.status,
                    summary: result.status === "complete" ? result.summary : undefined
                }
            })

            setSelectedDay(dayNumber)

            // Clear regenerateDay from URL
            const params = new URLSearchParams(searchParams.toString())
            params.delete('regenerateDay')
            router.replace(`/itinerary?${params.toString()}`)

            return true
        } catch (err: any) {
            console.error(`[Regenerate] Error:`, err)
            setError(`Failed to regenerate day ${dayNumber}: ${err.message}`)
            return false
        } finally {
            setGeneratingDay(null)
            isGeneratingRef.current = false
        }
    }

    // Generate a single day
    const generateSingleDay = async (itinId: string, dayNumber: number) => {
        // Prevent double generation
        if (isGeneratingRef.current) {
            console.log(`[Generate] Already generating, skipping day ${dayNumber}`)
            return false
        }

        isGeneratingRef.current = true
        console.log(`[Generate] Generating day ${dayNumber} for itinerary ${itinId}`)

        setGeneratingDay(dayNumber)

        try {
            const result = await ItineraryService.generateDay({
                itinerary_id: itinId,
                day_number: dayNumber
            })

            console.log(`[Generate] Day ${dayNumber} completed:`, result)

            // Update itinerary with new day
            setItinerary(prev => {
                if (!prev) return prev

                // Check if day already exists (for regeneration case)
                const existingDayIndex = prev.daily_itinerary.findIndex(d => d.day_number === dayNumber)
                let newDailyItinerary

                if (existingDayIndex >= 0) {
                    // Replace existing day
                    newDailyItinerary = [...prev.daily_itinerary]
                    newDailyItinerary[existingDayIndex] = result.day
                } else {
                    // Add new day
                    newDailyItinerary = [...prev.daily_itinerary, result.day]
                }

                return {
                    ...prev,
                    daily_itinerary: newDailyItinerary,
                    status: result.status,
                    summary: result.status === "complete" ? result.summary : undefined
                }
            })

            // Select the generated day
            setSelectedDay(dayNumber)

            return true

        } catch (err: any) {
            // Handle "Day already exists" error - skip to show the day
            if (err.message?.includes('already exists')) {
                console.log(`[Generate] Day ${dayNumber} already exists, skipping...`)
                setSelectedDay(dayNumber)
                return true
            }

            console.error(`[Generate] Error on day ${dayNumber}:`, err)
            setError(`Failed to generate day ${dayNumber}: ${err.message}`)
            return false
        } finally {
            setGeneratingDay(null)
            isGeneratingRef.current = false
        }
    }

    // Continue to next day - go to preferences to select places
    const handleContinueGenerate = () => {
        if (!itinerary) return

        const nextDay = (itinerary.daily_itinerary?.length || 0) + 1
        const totalDays = itinerary.trip_duration_days || 3

        if (nextDay > totalDays) {
            console.log('All days generated')
            return
        }

        // Redirect to preferences to select places for next day
        console.log(`Continuing to preferences for Day ${nextDay}`)
        router.push(`/preferences?cityId=${itinerary.city_id}&itineraryId=${itinerary.itinerary_id}&editDay=${nextDay}`)
    }

    // Edit current day - go to preferences with day context
    const handleEditDay = (dayNumber: number) => {
        if (!itinerary) return

        // Store edit context in localStorage
        const editContext = {
            itinerary_id: itinerary.itinerary_id,
            city_id: itinerary.city_id,
            day_number: dayNumber,
            mode: 'edit_day'
        }
        localStorage.setItem('editDayContext', JSON.stringify(editContext))

        // Navigate to preferences with edit mode
        router.push(`/preferences?cityId=${itinerary.city_id}&itineraryId=${itinerary.itinerary_id}&editDay=${dayNumber}`)
    }

    // Load existing itinerary and auto-generate if needed
    useEffect(() => {
        const loadAndGenerate = async () => {
            if (!itineraryId) {
                setError('No itinerary ID provided. Please start from the dashboard.')
                return
            }

            if (!token) {
                console.log('No token available yet, waiting...')
                return
            }

            // Prevent double loading from React Strict Mode
            if (hasLoadedRef.current) {
                console.log('Already loaded, skipping...')
                return
            }
            hasLoadedRef.current = true

            try {
                setIsGenerating(true)
                setError(null)

                console.log('Loading itinerary:', itineraryId)

                // Load existing itinerary
                const data = await ItineraryService.getItinerary(itineraryId)
                console.log('Loaded itinerary:', data)
                setItinerary(data)

                // Check generated days
                const generatedDays = data.daily_itinerary?.length || 0
                // Handle null trip_duration_days - default to 3 days
                let totalDays = data.trip_duration_days

                if (!totalDays || totalDays <= 0) {
                    console.warn('trip_duration_days is null/0, defaulting to 3 days')
                    totalDays = 3
                    // Update itinerary state with corrected totalDays
                    setItinerary(prev => prev ? { ...prev, trip_duration_days: 3 } : prev)
                }

                console.log(`Status: ${data.status}, Generated: ${generatedDays}/${totalDays}`)
                console.log('Full itinerary data:', data)

                // Check if we need to regenerate a specific day (from Edit flow)
                if (regenerateDayParam) {
                    const dayToRegenerate = parseInt(regenerateDayParam)
                    console.log(`[Edit Flow] Regenerating day ${dayToRegenerate}...`)
                    await regenerateDay(data.itinerary_id, dayToRegenerate)
                }
                // Auto-generate ONLY the first day if none exist
                else if (data.status === 'pending' && generatedDays === 0) {
                    console.log('Auto-generating first day...')
                    await generateSingleDay(data.itinerary_id, 1)
                } else if (generatedDays > 0) {
                    // Set selected day to the last generated day
                    setSelectedDay(generatedDays)
                    console.log(`Showing day ${generatedDays}. User can Continue or Edit.`)
                } else {
                    console.log('Itinerary is complete')
                }
            } catch (err: any) {
                console.error('Error loading itinerary:', err)
                setError(err.message || 'Failed to load itinerary')
            } finally {
                setIsGenerating(false)
            }
        }

        loadAndGenerate()
    }, [itineraryId, token])

    // Fetch place details
    const fetchPlaceDetails = async (placeId: string) => {
        if (placeDetails[placeId] || loadingDetails.has(placeId)) return

        setLoadingDetails(prev => new Set(prev).add(placeId))
        try {
            const data = await PlacesService.getPlaceById(placeId)
            setPlaceDetails(prev => ({ ...prev, [placeId]: data }))
        } catch (err) {
            console.error("Failed to fetch place details:", err)
        } finally {
            setLoadingDetails(prev => {
                const s = new Set(prev)
                s.delete(placeId)
                return s
            })
        }
    }

    // Toggle block expansion
    const toggleBlock = (blockKey: string, placeId: string) => {
        const newExpanded = new Set(expandedBlocks)
        if (newExpanded.has(blockKey)) {
            newExpanded.delete(blockKey)
        } else {
            newExpanded.add(blockKey)
            fetchPlaceDetails(placeId)
        }
        setExpandedBlocks(newExpanded)
    }

    // Navigate days
    const goToPrevDay = () => {
        if (selectedDay > 1) setSelectedDay(selectedDay - 1)
    }

    const goToNextDay = () => {
        if (itinerary && selectedDay < itinerary.daily_itinerary.length) {
            setSelectedDay(selectedDay + 1)
        }
    }

    // Current day data
    const currentDay = itinerary?.daily_itinerary.find(d => d.day_number === selectedDay)

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B]">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,229,180,0.08)_0%,transparent_50%)]" />
            </div>

            {/* Header */}
            <header className="border-b border-white/10 bg-[#E0F7FA]/95 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/planner"
                            className="flex items-center gap-2 text-[#64748B] hover:text-white transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-white/20" />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#94A3B8]">VIETJOURNEY</p>
                            <h1 className="text-sm font-semibold text-[#0F172A]">Your Itinerary</h1>
                        </div>
                    </div>
                    <nav className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20 transition">
                                    {user?.fullname || "User"} ▼
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-[#1A1D1C]/95 backdrop-blur-lg border-white/10">
                                <DropdownMenuItem onClick={() => router.push("/profile")} className="text-white hover:bg-white/10 cursor-pointer">
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/planner")} className="text-white hover:bg-white/10 cursor-pointer">
                                    Dashboard
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { logout(); router.push("/login") }} className="text-red-400 hover:bg-red-500/10 cursor-pointer">
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-sm underline hover:no-underline">Dismiss</button>
                    </div>
                )}

                {/* No itinerary - Show message */}
                {!itinerary && !isGenerating && !error && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <MapPin className="w-10 h-10 text-[#5FCBC4]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">No Itinerary Found</h2>
                        <p className="text-[#64748B] mb-8 max-w-md mx-auto">
                            Start planning your trip by selecting a destination and your preferences.
                        </p>
                        <Link
                            href="/planner"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] text-[#FFFFFF] font-bold rounded-xl hover:scale-105 transition"
                        >
                            <Home className="w-5 h-5" />
                            Go to Planner
                        </Link>
                    </div>
                )}

                {/* Loading indicator */}
                {isGenerating && !itinerary && (
                    <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-[#5FCBC4] mx-auto mb-4" />
                        <p className="text-lg">Loading your itinerary...</p>
                    </div>
                )}

                {/* Itinerary View */}
                {itinerary && (
                    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
                        {/* Left Sidebar - Trip Info */}
                        <aside className="space-y-6">
                            {/* Trip Summary Card */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
                                <h2 className="text-lg font-semibold mb-4 text-[#5FCBC4]">Trip Summary</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">Duration</p>
                                            <p className="font-medium">{itinerary.trip_duration_days} days</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">Travelers</p>
                                            <p className="font-medium">{itinerary.guest_count} guests</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#64748B]">Budget</p>
                                            <p className="font-medium">${itinerary.budget}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-6 pt-4 border-t border-white/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#64748B]">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${itinerary.status === "complete"
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : "bg-amber-500/20 text-amber-400"
                                            }`}>
                                            {itinerary.status === "complete" ? "Complete" : "In Progress"}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-[#64748B]">
                                        {itinerary.daily_itinerary.length} / {itinerary.trip_duration_days || 3} days planned
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] transition-all"
                                            style={{ width: `${((itinerary.daily_itinerary.length || 0) / (itinerary.trip_duration_days || 3)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cost Summary (if complete) */}
                            {itinerary.summary && (
                                <div className="rounded-2xl border border-[#5FCBC4]/20 bg-gradient-to-br from-[#5FCBC4]/10 to-[#4AB8B0]/5 p-6">
                                    <h3 className="text-sm font-semibold mb-4 text-[#5FCBC4]">Cost Breakdown</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[#64748B]">Total Cost</span>
                                            <span className="font-bold text-white">${itinerary.summary.total_cost}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#64748B]">Per Person</span>
                                            <span className="text-white">${itinerary.summary.cost_per_person}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#64748B]">Per Day (avg)</span>
                                            <span className="text-white">${itinerary.summary.avg_cost_per_day}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-white/10">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#64748B]">Budget Used</span>
                                                <span className={`font-bold ${itinerary.summary.budget_utilized_percent > 100
                                                    ? 'text-red-400'
                                                    : 'text-emerald-400'
                                                    }`}>
                                                    {itinerary.summary.budget_utilized_percent}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${itinerary.summary.budget_utilized_percent > 100
                                                        ? 'bg-red-400'
                                                        : 'bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0]'
                                                        }`}
                                                    style={{ width: `${Math.min(itinerary.summary.budget_utilized_percent, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Day Selector */}
                            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-[#5FCBC4]">Select Day</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={goToPrevDay}
                                            disabled={selectedDay <= 1}
                                            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={goToNextDay}
                                            disabled={!itinerary || selectedDay >= itinerary.daily_itinerary.length}
                                            className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2">
                                    {Array.from({ length: itinerary.trip_duration_days }, (_, i) => i + 1).map(day => {
                                        const hasData = itinerary.daily_itinerary.some(d => d.day_number === day)
                                        const dayData = itinerary.daily_itinerary.find(d => d.day_number === day)
                                        const isGeneratingThis = generatingDay === day
                                        const isSelected = selectedDay === day

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => hasData && setSelectedDay(day)}
                                                disabled={!hasData && !isGeneratingThis}
                                                className={`relative p-3 rounded-xl text-center transition-all ${isSelected
                                                    ? "bg-gradient-to-br from-[#5FCBC4] to-[#4AB8B0] text-[#FFFFFF] shadow-lg shadow-[#5FCBC4]/20"
                                                    : hasData
                                                        ? "bg-white/10 text-white hover:bg-white/20"
                                                        : "bg-white/5 text-[#94A3B8] cursor-not-allowed"
                                                    } ${isGeneratingThis ? "animate-pulse" : ""}`}
                                            >
                                                <span className="block text-xs opacity-70">Day</span>
                                                <span className="block text-lg font-bold">{day}</span>
                                                {dayData && (
                                                    <span className={`block text-[10px] mt-1 ${isSelected ? 'opacity-80' : 'text-[#64748B]'}`}>
                                                        {formatShortDate(dayData.date)}
                                                    </span>
                                                )}
                                                {isGeneratingThis && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                                                        <Loader2 className="w-5 h-5 animate-spin text-[#5FCBC4]" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </aside>

                        {/* Right Content - Day Timeline */}
                        <div className="min-h-[600px]">
                            {currentDay ? (
                                <div>
                                    {/* Day Header */}
                                    <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-[#5FCBC4]/20 to-[#4AB8B0]/10 border border-[#5FCBC4]/30">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm uppercase tracking-widest text-[#5FCBC4] mb-1">
                                                    Day {currentDay.day_number}
                                                </p>
                                                <h2 className="text-2xl font-bold">{formatDate(currentDay.date)}</h2>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[#64748B]">Estimated Cost</p>
                                                <p className="text-2xl font-bold text-[#5FCBC4]">${currentDay.day_cost}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-4 text-sm text-[#475569]">
                                            <span>{currentDay.blocks.length} activities</span>
                                            <span>•</span>
                                            <span>Full day planned</span>
                                        </div>
                                    </div>

                                    {/* Timeline */}
                                    <div className="relative">
                                        {/* Timeline Line */}
                                        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#5FCBC4] via-[#4AB8B0] to-[#5FCBC4]/20" />

                                        <div className="space-y-6">
                                            {currentDay.blocks.map((block, idx) => {
                                                const blockKey = `${currentDay.day_number}-${idx}`
                                                const isExpanded = expandedBlocks.has(blockKey)
                                                const details = placeDetails[block.place.id]
                                                const isLoading = loadingDetails.has(block.place.id)

                                                return (
                                                    <div key={blockKey} className="relative pl-16">
                                                        {/* Timeline Dot */}
                                                        <div className="absolute left-6 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-[#5FCBC4] to-[#4AB8B0] flex items-center justify-center z-10 ring-4 ring-[#E0F7FA]">
                                                            <div className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
                                                        </div>

                                                        {/* Block Card */}
                                                        <div
                                                            onClick={() => toggleBlock(blockKey, block.place.id)}
                                                            className={`cursor-pointer rounded-2xl border bg-gradient-to-br backdrop-blur-sm p-5 transition-all hover:scale-[1.01] hover:shadow-xl ${getBlockColor(block.block_type)}`}
                                                        >
                                                            {/* Block Header */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-3xl">{getBlockIcon(block.block_type)}</span>
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                                                                            {getBlockLabel(block.block_type)}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 text-sm text-white/60">
                                                                            <Clock className="w-3 h-3" />
                                                                            <span>{block.time_range}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="flex items-center gap-1 text-amber-400">
                                                                        <Star className="w-4 h-4 fill-current" />
                                                                        <span className="font-bold">{block.place.rating}</span>
                                                                    </div>
                                                                    <span className="text-lg font-bold text-emerald-400">${block.estimated_cost}</span>
                                                                </div>
                                                            </div>

                                                            {/* Place Name */}
                                                            <h3 className="text-xl font-bold text-white mb-2">{block.place.name}</h3>

                                                            {/* Quick Info */}
                                                            <div className="flex items-center gap-4 text-sm text-white/60">
                                                                <span>{block.place.userRatingCount.toLocaleString()} reviews</span>
                                                            </div>

                                                            {/* Expanded Details */}
                                                            {isExpanded && (
                                                                <div className="mt-4 pt-4 border-t border-white/20">
                                                                    {isLoading ? (
                                                                        <div className="flex items-center justify-center py-4">
                                                                            <Loader2 className="w-6 h-6 animate-spin text-[#5FCBC4]" />
                                                                        </div>
                                                                    ) : details ? (
                                                                        <div className="space-y-6">
                                                                            {/* Main Info Grid - Image Left, Info Right */}
                                                                            <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
                                                                                {/* Left - Image Gallery */}
                                                                                {details.image_url && details.image_url.length > 0 && (() => {
                                                                                    const currentImageIdx = selectedImageIndex[blockKey] || 0
                                                                                    return (
                                                                                        <div className="space-y-3">
                                                                                            {/* Main Image */}
                                                                                            <div
                                                                                                className="relative rounded-xl overflow-hidden group"
                                                                                                onClick={(e) => e.stopPropagation()}
                                                                                            >
                                                                                                <img
                                                                                                    src={details.image_url[currentImageIdx]}
                                                                                                    alt={details.displayName_text}
                                                                                                    className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                                                                                />
                                                                                                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                                                                                    <span className="text-xs font-semibold text-white">{currentImageIdx + 1} / {details.image_url.length}</span>
                                                                                                </div>
                                                                                            </div>

                                                                                            {/* Thumbnail Gallery */}
                                                                                            {details.image_url.length > 1 && (
                                                                                                <div className="grid grid-cols-4 gap-2">
                                                                                                    {details.image_url.slice(0, 8).map((url, idx) => (
                                                                                                        <div
                                                                                                            key={idx}
                                                                                                            className={`rounded-lg overflow-hidden group cursor-pointer transition-all ${currentImageIdx === idx
                                                                                                                ? 'ring-2 ring-[#5FCBC4] ring-offset-2 ring-offset-[#E0F7FA]'
                                                                                                                : 'opacity-70 hover:opacity-100'
                                                                                                                }`}
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation()
                                                                                                                setSelectedImageIndex(prev => ({ ...prev, [blockKey]: idx }))
                                                                                                            }}
                                                                                                        >
                                                                                                            <img
                                                                                                                src={url}
                                                                                                                alt={`${details.displayName_text} ${idx + 1}`}
                                                                                                                className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                                                                                                            />
                                                                                                        </div>
                                                                                                    ))}
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )
                                                                                })()}

                                                                                {/* Right - Place Information */}
                                                                                <div className="space-y-4">
                                                                                    <div>
                                                                                        <h4 className="text-2xl font-bold text-white mb-3">
                                                                                            {details.displayName_text}
                                                                                        </h4>

                                                                                        {/* Rating & Reviews */}
                                                                                        <div className="flex items-center gap-4 mb-3">
                                                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                                                                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                                                                                <span className="font-bold text-amber-400 text-lg">{details.rating}</span>
                                                                                            </div>
                                                                                            <span className="text-sm text-[#64748B]">
                                                                                                ({details.userRatingCount?.toLocaleString() || 0} reviews)
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Average Price */}
                                                                                        {details.avg_price && (
                                                                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 inline-flex">
                                                                                                <DollarSign className="w-5 h-5 text-emerald-400" />
                                                                                                <div>
                                                                                                    <p className="text-xs text-emerald-300/70 uppercase tracking-wide">Avg. Price</p>
                                                                                                    <p className="text-xl font-bold text-emerald-400">${details.avg_price}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Editorial Summary */}
                                                                            {details.editorialSummary_text && (
                                                                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                                                                    <h5 className="text-sm font-semibold text-[#5FCBC4] mb-2 uppercase tracking-wide">About</h5>
                                                                                    <p className="text-sm text-[#475569] leading-relaxed">
                                                                                        {details.editorialSummary_text}
                                                                                    </p>
                                                                                </div>
                                                                            )}

                                                                            {/* Reviews Section */}
                                                                            {details.reviews && details.reviews.length > 0 && (
                                                                                <div className="space-y-3">
                                                                                    <h5 className="text-sm font-semibold text-[#5FCBC4] uppercase tracking-wide">Recent Reviews</h5>
                                                                                    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                                                                                        {details.reviews.slice(0, 3).map((review, idx) => (
                                                                                            <div
                                                                                                key={idx}
                                                                                                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                                                                            >
                                                                                                {/* Review Header */}
                                                                                                <div className="flex items-start justify-between mb-3">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                                                                                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                                                                                            <span className="font-bold text-amber-400 text-sm">{review.rating}</span>
                                                                                                        </div>
                                                                                                        {review.authorAttribution?.displayName && (
                                                                                                            <span className="text-sm font-medium text-white/90">
                                                                                                                {review.authorAttribution.displayName}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {review.relativePublishTimeDescription && (
                                                                                                        <span className="text-xs text-[#64748B]">
                                                                                                            {review.relativePublishTimeDescription}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>

                                                                                                {/* Review Text */}
                                                                                                {review.text?.text && (
                                                                                                    <p className="text-sm text-[#475569] leading-relaxed line-clamp-4">
                                                                                                        {review.text.text}
                                                                                                    </p>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm text-[#64748B]">Click to load details...</p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Transport to next */}
                                                            {block.transport_to_next && idx < currentDay.blocks.length - 1 && (
                                                                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4 text-sm text-white/50">
                                                                    <Navigation className="w-4 h-4" />
                                                                    <span className="capitalize font-medium">{block.transport_to_next}</span>
                                                                    <span>•</span>
                                                                    <span>{block.distance_to_next_km} km</span>
                                                                    <span>•</span>
                                                                    <span>{block.travel_time_minutes} min</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Buttons - Continue / Edit */}
                                    <div className="mt-8 p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-[#64748B]">Day {currentDay.day_number} of {itinerary.trip_duration_days || 3}</p>
                                                <p className="text-lg font-semibold text-white">
                                                    {currentDay.day_number < (itinerary.trip_duration_days || 3)
                                                        ? "Ready to plan the next day?"
                                                        : itinerary.status === 'complete'
                                                            ? "Your itinerary is complete!"
                                                            : "Generate remaining days to complete"
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEditDay(currentDay.day_number)}
                                                disabled={isGenerating || generatingDay !== null}
                                                className="flex-1 py-4 px-6 rounded-xl border border-white/20 bg-white/5 text-white font-semibold hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit Day {currentDay.day_number}
                                            </button>

                                            {/* Continue Button - show if not all days generated */}
                                            {(itinerary.daily_itinerary?.length || 0) < (itinerary.trip_duration_days || 3) && (
                                                <button
                                                    onClick={handleContinueGenerate}
                                                    disabled={isGenerating || generatingDay !== null}
                                                    className="flex-1 py-4 px-6 rounded-xl bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] text-[#FFFFFF] font-bold hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {generatingDay !== null ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            Generating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronRight className="w-5 h-5" />
                                                            Continue to Day {(itinerary.daily_itinerary?.length || 0) + 1}
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Complete message */}
                                            {itinerary.status === 'complete' && (
                                                <button
                                                    onClick={() => {
                                                        // Store itinerary data for payment page
                                                        const paymentData = {
                                                            itinerary_id: itinerary.itinerary_id,
                                                            user_id: itinerary.user_id,
                                                            city_id: itinerary.city_id,
                                                            trip_duration_days: itinerary.trip_duration_days,
                                                            start_date: itinerary.start_date,
                                                            guest_count: itinerary.guest_count,
                                                            budget: itinerary.budget,
                                                            summary: itinerary.summary,
                                                            daily_itinerary: itinerary.daily_itinerary,
                                                            book_flight: itinerary.book_flight,
                                                            flights: itinerary.flights,
                                                        }
                                                        localStorage.setItem('payment_itinerary_data', JSON.stringify(paymentData))
                                                        router.push(`/payments?itineraryId=${itinerary.itinerary_id}`)
                                                    }}
                                                    className="flex-1 py-4 px-6 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition"
                                                >
                                                    <CreditCard className="w-5 h-5" />
                                                    Proceed to Payment
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : generatingDay ? (
                                <div className="flex flex-col items-center justify-center h-full py-20">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-[#5FCBC4]/10 animate-ping absolute" />
                                        <div className="w-20 h-20 rounded-full bg-[#5FCBC4]/20 flex items-center justify-center relative">
                                            <Loader2 className="w-10 h-10 animate-spin text-[#5FCBC4]" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-lg font-semibold">Generating Day {generatingDay}...</p>
                                    <p className="text-sm text-[#64748B] mt-2">Finding the best places for you</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-[#64748B]">
                                    <MapPin className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Select a day to view the itinerary</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-white/10 bg-[#1E293B]/80 backdrop-blur py-6">
                <div className="mx-auto max-w-7xl px-6 text-center text-sm text-[#94A3B8]">
                    © 2025 VietJourney. All rights reserved.
                </div>
            </footer>
        </div>
    )
}

export default function ItineraryPage() {
    return (
        <AuthGuard>
            <ItineraryContent />
        </AuthGuard>
    )
}

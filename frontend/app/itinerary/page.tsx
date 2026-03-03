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
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslations } from "next-intl"
import {
    ItineraryService,
    Itinerary,
    DayItinerary,
    Block,
    GenerateDayResponse
} from "@/services/itinerary.service"
import { PlacesService } from "@/services/places.service"
import { PaymentService } from "@/services/payment.service"
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
        breakfast: "from-amber-50 to-orange-50 border-amber-200",
        morning_activity: "from-sky-50 to-blue-50 border-sky-200",
        lunch: "from-emerald-50 to-green-50 border-emerald-200",
        afternoon_activity: "from-violet-50 to-purple-50 border-violet-200",
        dinner: "from-rose-50 to-pink-50 border-rose-200",
        hotel: "from-slate-50 to-gray-50 border-slate-200"
    }
    return colors[blockType] || "from-white to-[#F0FDFA] border-[#E4E4E7]"
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

const getBlockLabel = (blockType: string, t: any): string => {
    const labels: Record<string, string> = {
        breakfast: t("breakfast"),
        morning_activity: t("morningActivity"),
        lunch: t("lunch"),
        afternoon_activity: t("afternoonActivity"),
        dinner: t("dinner"),
        hotel: t("hotel")
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
    const t = useTranslations("ItineraryPage")

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
    const [vnpayLoading, setVnpayLoading] = useState(false)
    const [vnpayError, setVnpayError] = useState<string | null>(null)

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
        <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">

            {/* Header */}
            <header className="border-b border-[#E4E4E7] bg-white sticky top-0 z-50 shadow-sm">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/planner"
                            className="flex items-center gap-2 text-[#A1A1AA] hover:text-[#5FCBC4] transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-[#E4E4E7]" />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">{t("brand")}</p>
                            <h1 className="text-sm font-semibold text-[#0F4C5C]">{t("pageTitle")}</h1>
                        </div>
                    </div>
                    <nav className="flex items-center gap-3">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="rounded-full border border-[#E4E4E7] bg-white px-4 py-2 text-sm text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition">
                                    {user?.fullname || "User"} ▼
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-white border-[#E4E4E7] shadow-lg">
                                <DropdownMenuItem onClick={() => router.push("/profile")} className="text-[#3F3F46] hover:bg-[#CCFBF1] cursor-pointer">
                                    {t("profile")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push("/planner")} className="text-[#3F3F46] hover:bg-[#CCFBF1] cursor-pointer">
                                    {t("dashboard")}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => { logout(); router.push("/login") }} className="text-red-500 hover:bg-red-50 cursor-pointer">
                                    {t("logout")}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
                        <LanguageSwitcher />
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-6 py-8">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="text-sm underline hover:no-underline">Dismiss</button>
                    </div>
                )}

                {/* No itinerary - Show message */}
                {!itinerary && !isGenerating && !error && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                            <MapPin className="w-10 h-10 text-[#5FCBC4]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 text-[#0F4C5C]">{t("noItineraryTitle")}</h2>
                        <p className="text-[#A1A1AA] mb-8 max-w-md mx-auto">
                            {t("noItineraryDesc")}
                        </p>
                        <Link
                            href="/planner"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-[#5FCBC4] text-white font-bold rounded-xl hover:bg-[#4AB8B0] transition"
                        >
                            <Home className="w-5 h-5" />
                            {t("goToPlanner")}
                        </Link>
                    </div>
                )}

                {/* Loading indicator */}
                {isGenerating && !itinerary && (
                    <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-[#5FCBC4] mx-auto mb-4" />
                        <p className="text-lg text-[#3F3F46]">Loading your itinerary...</p>
                    </div>
                )}

                {/* Itinerary View */}
                {itinerary && (
                    <div className="grid lg:grid-cols-[320px_1fr] gap-8">
                        {/* Left Sidebar - Trip Info */}
                        <aside className="space-y-6">
                            {/* Trip Summary Card */}
                            <div className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm p-6">
                                <h2 className="text-lg font-semibold mb-4 text-[#0F4C5C]">{t("tripSummary")}</h2>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <Calendar className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#A1A1AA]">{t("duration")}</p>
                                            <p className="font-medium text-[#3F3F46]">
                                                {itinerary.trip_duration_days} {t("days")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#A1A1AA]">{t("travelers")}</p>
                                            <p className="font-medium text-[#3F3F46]">
                                                {itinerary.guest_count} {t("guests")}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#5FCBC4]/10 flex items-center justify-center">
                                            <DollarSign className="w-5 h-5 text-[#5FCBC4]" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-[#A1A1AA]">{t("budget")}</p>
                                            <p className="font-medium text-[#3F3F46]">${itinerary.budget}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Status Badge */}
                                <div className="mt-6 pt-4 border-t border-[#E4E4E7]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-[#A1A1AA]">Status</span>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${itinerary.status === "complete"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-amber-100 text-amber-700"
                                            }`}>
                                            {itinerary.status === "complete" ? "Complete" : "In Progress"}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-sm text-[#A1A1AA]">
                                        {itinerary.daily_itinerary.length} / {itinerary.trip_duration_days || 3} days planned
                                    </div>

                                    {/* Progress bar */}
                                    <div className="mt-3 h-2 bg-[#E4E4E7] rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] transition-all"
                                            style={{ width: `${((itinerary.daily_itinerary.length || 0) / (itinerary.trip_duration_days || 3)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cost Summary (if complete) */}
                            {itinerary.summary && (
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm p-6">
                                    <h3 className="text-sm font-semibold mb-4 text-[#0F4C5C]">Cost Breakdown</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-[#A1A1AA]">Total Cost</span>
                                            <span className="font-bold text-[#0F4C5C]">${itinerary.summary.total_cost}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#A1A1AA]">Per Person</span>
                                            <span className="text-[#3F3F46]">${itinerary.summary.cost_per_person}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-[#A1A1AA]">Per Day (avg)</span>
                                            <span className="text-[#3F3F46]">${itinerary.summary.avg_cost_per_day}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-[#E4E4E7]">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[#A1A1AA]">Budget Used</span>
                                                <span className={`font-bold ${itinerary.summary.budget_utilized_percent > 100
                                                    ? 'text-red-500'
                                                    : 'text-emerald-600'
                                                    }`}>
                                                    {itinerary.summary.budget_utilized_percent}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 bg-[#E4E4E7] rounded-full overflow-hidden">
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
                            <div className="rounded-2xl border border-[#E4E4E7] bg-white shadow-sm p-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-[#0F4C5C]">{t("selectDay")}</h3>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={goToPrevDay}
                                            disabled={selectedDay <= 1}
                                            className="p-1 rounded hover:bg-[#CCFBF1] text-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed transition"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={goToNextDay}
                                            disabled={!itinerary || selectedDay >= itinerary.daily_itinerary.length}
                                            className="p-1 rounded hover:bg-[#CCFBF1] text-[#3F3F46] disabled:opacity-30 disabled:cursor-not-allowed transition"
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
                                                    ? "bg-[#5FCBC4] text-white shadow-md"
                                                    : hasData
                                                        ? "bg-[#CCFBF1] text-[#0F4C5C] hover:bg-[#5FCBC4]/20 border border-[#E4E4E7]"
                                                        : "bg-[#F0FDFA] text-[#A1A1AA] cursor-not-allowed border border-[#E4E4E7]"
                                                    } ${isGeneratingThis ? "animate-pulse" : ""}`}
                                            >
                                                <span className="block text-xs opacity-70">{t("dayLabel")}</span>
                                                <span className="block text-lg font-bold">{day}</span>
                                                {dayData && (
                                                    <span className={`block text-[10px] mt-1 ${isSelected ? 'opacity-90' : 'text-[#A1A1AA]'}`}>
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
                                    <div className="mb-8 p-6 rounded-2xl bg-white border border-[#E4E4E7] shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm uppercase tracking-widest text-[#5FCBC4] mb-1">
                                                    Day {currentDay.day_number}
                                                </p>
                                                <h2 className="text-2xl font-bold text-[#0F4C5C]">{formatDate(currentDay.date)}</h2>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-[#A1A1AA]">{t("estimatedCost")}</p>
                                                <p className="text-2xl font-bold text-[#5FCBC4]">${currentDay.day_cost}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex gap-4 text-sm text-[#A1A1AA]">
                                            <span>{currentDay.blocks.length} {t("activities")}</span>
                                            <span>•</span>
                                            <span>{t("fullDayPlanned")}</span>
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
                                                        <div className="absolute left-6 top-6 -translate-x-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-[#5FCBC4] to-[#4AB8B0] flex items-center justify-center z-10 ring-4 ring-[#F0FDFA]">
                                                            <div className="w-2 h-2 rounded-full bg-[#FFFFFF]" />
                                                        </div>

                                                        {/* Block Card */}
                                                        <div
                                                            onClick={() => toggleBlock(blockKey, block.place.id)}
                                                            className={`cursor-pointer rounded-2xl border bg-gradient-to-br p-5 transition-all hover:scale-[1.01] hover:shadow-md ${getBlockColor(block.block_type)}`}
                                                        >
                                                            {/* Block Header */}
                                                            <div className="flex items-start justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-3xl">{getBlockIcon(block.block_type)}</span>
                                                                    <div>
                                                                        <p className="text-xs font-semibold uppercase tracking-wide text-[#A1A1AA]">
                                                                            {getBlockLabel(block.block_type, t)}
                                                                        </p>
                                                                        <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
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
                                                                    <span className="text-lg font-bold text-emerald-600">${block.estimated_cost}</span>
                                                                </div>
                                                            </div>

                                                            {/* Place Name */}
                                                            <h3 className="text-xl font-bold text-[#0F4C5C] mb-2">{block.place.name}</h3>

                                                            {/* Quick Info */}
                                                            <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                                                                <span>{block.place.userRatingCount.toLocaleString()} {t("reviews")}</span>
                                                            </div>

                                                            {/* Expanded Details */}
                                                            {isExpanded && (
                                                                <div className="mt-4 pt-4 border-t border-[#E4E4E7]">
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
                                                                                                                ? 'ring-2 ring-[#5FCBC4] ring-offset-2 ring-offset-[#F0FDFA]'
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
                                                                                        <h4 className="text-2xl font-bold text-[#0F4C5C] mb-3">
                                                                                            {details.displayName_text}
                                                                                        </h4>

                                                                                        {/* Rating & Reviews */}
                                                                                        <div className="flex items-center gap-4 mb-3">
                                                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                                                                                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                                                                                <span className="font-bold text-amber-400 text-lg">{details.rating}</span>
                                                                                            </div>
                                                                                            <span className="text-sm text-[#A1A1AA]">
                                                                                                ({details.userRatingCount?.toLocaleString() || 0} reviews)
                                                                                            </span>
                                                                                        </div>

                                                                                        {/* Average Price */}
                                                                                        {details.avg_price && (
                                                                                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 inline-flex">
                                                                                                <DollarSign className="w-5 h-5 text-emerald-600" />
                                                                                                <div>
                                                                                                    <p className="text-xs text-emerald-500 uppercase tracking-wide">Avg. Price</p>
                                                                                                    <p className="text-xl font-bold text-emerald-700">${details.avg_price}</p>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Editorial Summary */}
                                                                            {details.editorialSummary_text && (
                                                                                <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#E4E4E7]">
                                                                                    <h5 className="text-sm font-semibold text-[#5FCBC4] mb-2 uppercase tracking-wide">{t("about")}</h5>
                                                                                    <p className="text-sm text-[#3F3F46] leading-relaxed">
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
                                                                                                className="p-4 rounded-xl bg-white border border-[#E4E4E7] hover:bg-[#F0FDFA] transition-colors"
                                                                                            >
                                                                                                {/* Review Header */}
                                                                                                <div className="flex items-start justify-between mb-3">
                                                                                                    <div className="flex items-center gap-2">
                                                                                                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-200">
                                                                                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                                                                                            <span className="font-bold text-amber-600 text-sm">{review.rating}</span>
                                                                                                        </div>
                                                                                                        {review.authorAttribution?.displayName && (
                                                                                                            <span className="text-sm font-medium text-[#3F3F46]">
                                                                                                                {review.authorAttribution.displayName}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                    {review.relativePublishTimeDescription && (
                                                                                                        <span className="text-xs text-[#A1A1AA]">
                                                                                                            {review.relativePublishTimeDescription}
                                                                                                        </span>
                                                                                                    )}
                                                                                                </div>

                                                                                                {/* Review Text */}
                                                                                                {review.text?.text && (
                                                                                                    <p className="text-sm text-[#3F3F46] leading-relaxed line-clamp-4">
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
                                                                        <p className="text-sm text-[#A1A1AA]">Click to load details...</p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {/* Transport to next */}
                                                            {block.transport_to_next && idx < currentDay.blocks.length - 1 && (
                                                                <div className="mt-4 pt-4 border-t border-[#E4E4E7] flex items-center gap-4 text-sm text-[#A1A1AA]">
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
                                    <div className="mt-8 p-6 rounded-2xl border border-[#E4E4E7] bg-white shadow-sm">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <p className="text-sm text-[#A1A1AA]">{t("dayLabel")} {currentDay.day_number} / {itinerary.trip_duration_days || 3}</p>
                                                <p className="text-lg font-semibold text-[#0F4C5C]">
                                                    {currentDay.day_number < (itinerary.trip_duration_days || 3)
                                                        ? t("readyNext")
                                                        : itinerary.status === 'complete'
                                                            ? t("itineraryComplete")
                                                            : t("generateRemaining")
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => handleEditDay(currentDay.day_number)}
                                                disabled={isGenerating || generatingDay !== null}
                                                className="flex-1 py-4 px-6 rounded-xl border border-[#E4E4E7] bg-white text-[#3F3F46] font-semibold hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                {t("editDay")} {currentDay.day_number}
                                            </button>

                                            {/* Continue Button - show if not all days generated */}
                                            {(itinerary.daily_itinerary?.length || 0) < (itinerary.trip_duration_days || 3) && (
                                                <button
                                                    onClick={handleContinueGenerate}
                                                    disabled={isGenerating || generatingDay !== null}
                                                    className="flex-1 py-4 px-6 rounded-xl bg-[#5FCBC4] text-white font-bold hover:bg-[#4AB8B0] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                >
                                                    {generatingDay !== null ? (
                                                        <>
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                            {t("generating")}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronRight className="w-5 h-5" />
                                                            {t("continueToDay")} {(itinerary.daily_itinerary?.length || 0) + 1}
                                                        </>
                                                    )}
                                                </button>
                                            )}

                                            {/* Complete message */}
                                            {itinerary.status === 'complete' && (
                                                <div className="flex-1 flex flex-col gap-2">
                                                    {vnpayError && (
                                                        <p className="text-sm text-red-600 text-center">{vnpayError}</p>
                                                    )}
                                                    <button
                                                        disabled={vnpayLoading}
                                                        onClick={async () => {
                                                            setVnpayError(null)
                                                            setVnpayLoading(true)
                                                            try {
                                                                const amountUsd = itinerary.summary?.total_cost ?? itinerary.budget ?? 0
                                                                const orderInfo = `Thanh toan tour du lich ${itinerary.itinerary_id}`
                                                                const result = await PaymentService.createVnpayPaymentUrl({
                                                                    itinerary_id: itinerary.itinerary_id,
                                                                    amount_usd: amountUsd,
                                                                    order_info: orderInfo,
                                                                    language: 'vn',
                                                                })
                                                                window.location.href = result.payment_url
                                                            } catch (err: unknown) {
                                                                const msg = err instanceof Error ? err.message : 'Không thể tạo thanh toán VNPAY'
                                                                setVnpayError(msg)
                                                                setVnpayLoading(false)
                                                            }
                                                        }}
                                                        className="flex-1 py-4 px-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-100 transition disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {vnpayLoading ? (
                                                            <>
                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                Đang kết nối VNPAY...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard className="w-5 h-5" />
                                                                Thanh toán qua VNPAY
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : generatingDay ? (
                                <div className="flex flex-col items-center justify-center h-full py-20">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full bg-[#5FCBC4]/20 animate-ping absolute" />
                                        <div className="w-20 h-20 rounded-full bg-[#CCFBF1] flex items-center justify-center relative">
                                            <Loader2 className="w-10 h-10 animate-spin text-[#5FCBC4]" />
                                        </div>
                                    </div>
                                    <p className="mt-6 text-lg font-semibold text-[#0F4C5C]">Generating Day {generatingDay}...</p>
                                    <p className="text-sm text-[#A1A1AA] mt-2">Finding the best places for you</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-20 text-[#A1A1AA]">
                                    <MapPin className="w-12 h-12 mb-4 opacity-50" />
                                    <p>Select a day to view the itinerary</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="mt-auto border-t border-[#E4E4E7] bg-[#1E293B] py-6">
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

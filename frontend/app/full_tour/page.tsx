"use client"

import React, { useState, useEffect } from "react"
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
    Itinerary,
    DayItinerary,
    Block,
    ItineraryService
} from "@/services/itinerary.service"
import { PlacesService } from "@/services/places.service"
import {
    Loader2,
    MapPin,
    Calendar,
    Users,
    DollarSign,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    Star,
    Clock,
    Navigation,
    Home,
    Download,
    Share2
} from "lucide-react"
import { UserMenu } from "@/components/user-menu"
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

const formatFlightStopLabel = (flight: { stop_count?: number; type?: string }): string => {
    const c = flight.stop_count
    if (typeof c === "number") return c === 0 ? "Direct" : c === 1 ? "1 stop" : `${c} stops`
    return flight.type ?? "—"
}

function FullTourContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, logout, token } = useAuthStore()

    // State
    const [itinerary, setItinerary] = useState<Itinerary | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set([1])) // Day 1 expanded by default
    const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set())
    const [placeDetails, setPlaceDetails] = useState<Record<string, PlaceDetails>>({})
    const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
    const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({})

    // Get itinerary ID from URL params
    const itineraryId = searchParams.get("itineraryId") || ""

    // Load full tour data
    useEffect(() => {
        const loadFullTour = async () => {
            if (!itineraryId) {
                setError('No itinerary ID provided.')
                return
            }

            if (!token) {
                console.log('No token available yet, waiting...')
                return
            }

            try {
                setIsLoading(true)
                setError(null)

                console.log('Loading full tour:', itineraryId)

                // Use ItineraryService to fetch itinerary
                const data = await ItineraryService.getItinerary(itineraryId)
                console.log('Loaded full tour:', data)
                setItinerary(data)
            } catch (err: any) {
                console.error('Error loading full tour:', err)
                setError(err.response?.data?.error || err.message || 'Failed to load full tour')
            } finally {
                setIsLoading(false)
            }
        }

        loadFullTour()
    }, [itineraryId, token])

    // Toggle day expansion
    const toggleDay = (dayNumber: number) => {
        const newExpanded = new Set(expandedDays)
        if (newExpanded.has(dayNumber)) {
            newExpanded.delete(dayNumber)
        } else {
            newExpanded.add(dayNumber)
        }
        setExpandedDays(newExpanded)
    }

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
                            href="/history_tour"
                            className="flex items-center gap-2 text-[#64748B] hover:text-white transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm">Back</span>
                        </Link>
                        <div className="h-6 w-px bg-white/20" />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#94A3B8]">VIETJOURNEY</p>
                            <h1 className="text-sm font-semibold text-[#0F172A]">Full Tour</h1>
                        </div>
                    </div>
                    <UserMenu />
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

                {/* Loading indicator */}
                {isLoading && !itinerary && (
                    <div className="text-center py-20">
                        <Loader2 className="w-12 h-12 animate-spin text-[#5FCBC4] mx-auto mb-4" />
                        <p className="text-lg">Loading your full tour...</p>
                    </div>
                )}

                {/* No itinerary */}
                {!itinerary && !isLoading && !error && (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                            <MapPin className="w-10 h-10 text-[#5FCBC4]" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">No Tour Found</h2>
                        <p className="text-[#64748B] mb-8 max-w-md mx-auto">
                            Please provide a valid itinerary ID.
                        </p>
                        <Link
                            href="/history_tour"
                            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] text-[#FFFFFF] font-bold rounded-xl hover:scale-105 transition"
                        >
                            <Home className="w-5 h-5" />
                            Go to History Tour
                        </Link>
                    </div>
                )}

                {/* Full Tour View */}
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
                                </div>
                            </div>

                            {/* Cost Summary (if complete) */}
                            {itinerary.summary && (
                                <div className="rounded-2xl border border-[#5FCBC4]/20 bg-gradient-to-br from-[#5FCBC4]/10 to-[#4AB8B0]/5 p-6">
                                    <h3 className="text-sm font-semibold mb-4 text-[#5FCBC4]">Cost Breakdown</h3>
                                    <div className="space-y-3 text-sm">
                                        {itinerary.summary?.flight_total != null || (itinerary.book_flight && itinerary.flights) ? (
                                            <div className="flex justify-between">
                                                <span className="text-[#64748B]">Tổng giá vé máy bay</span>
                                                <span className="font-bold text-[#5FCBC4]">
                                                    {itinerary.summary?.flight_total != null
                                                        ? itinerary.summary.flight_total >= 1000
                                                            ? `${new Intl.NumberFormat("vi-VN").format(itinerary.summary.flight_total)}đ`
                                                            : `$${itinerary.summary.flight_total}`
                                                        : itinerary.flights
                                                            ? (() => {
                                                                const total = (itinerary.flights.selectedDepartureFlight?.price ?? 0) + (itinerary.flights.selectedReturnFlight?.price ?? 0)
                                                                return total >= 1000 ? `${new Intl.NumberFormat("vi-VN").format(total)}đ` : `$${total}`
                                                            })()
                                                            : "—"}
                                                </span>
                                            </div>
                                        ) : null}
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
                        </aside>

                        {/* Right Content - All Days */}
                        <div className="space-y-6">
                            {/* Booked Flights (from flights page) */}
                            {itinerary.book_flight && itinerary.flights && (
                                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden p-6">
                                    <h3 className="text-lg font-bold text-[#5FCBC4] mb-4 flex items-center gap-2">
                                        <span>✈️</span> Booked Flights
                                    </h3>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2">Departure</p>
                                            <p className="font-semibold text-white">{itinerary.flights.selectedDepartureFlight.airline}</p>
                                            <p className="text-sm text-[#475569] mt-1">
                                                {itinerary.flights.selectedDepartureFlight.departCode} → {itinerary.flights.selectedDepartureFlight.arriveCode}
                                            </p>
                                            <p className="text-sm text-[#64748B]">
                                                {itinerary.flights.selectedDepartureFlight.departTime} – {itinerary.flights.selectedDepartureFlight.arriveTime} · {itinerary.flights.selectedDepartureFlight.duration} · {formatFlightStopLabel(itinerary.flights.selectedDepartureFlight)}
                                            </p>
                                            {itinerary.flights.selectedDepartureFlight.stops && itinerary.flights.selectedDepartureFlight.stops.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-[#94A3B8] mb-1">Quá cảnh</p>
                                                    {itinerary.flights.selectedDepartureFlight.stops.map((stop: { iata: string; name: string; arrival: string; departure: string }, i: number) => (
                                                        <div key={i} className="text-xs text-[#64748B] py-1">
                                                            <span className="font-medium text-[#475569]">{stop.iata}</span> {stop.name}
                                                            <br />
                                                            <span className="text-[#94A3B8]">Arrival: {new Date(stop.arrival).toLocaleString("vi-VN")}</span>
                                                            <br />
                                                            <span className="text-[#94A3B8]">Departure: {new Date(stop.departure).toLocaleString("vi-VN")}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-2 font-bold text-[#5FCBC4]">
                                                {itinerary.flights.selectedDepartureFlight.price >= 1000
                                                    ? `${new Intl.NumberFormat("vi-VN").format(itinerary.flights.selectedDepartureFlight.price)}đ`
                                                    : `$${itinerary.flights.selectedDepartureFlight.price}`}
                                            </p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wider text-[#94A3B8] mb-2">Return</p>
                                            <p className="font-semibold text-white">{itinerary.flights.selectedReturnFlight.airline}</p>
                                            <p className="text-sm text-[#475569] mt-1">
                                                {itinerary.flights.selectedReturnFlight.departCode} → {itinerary.flights.selectedReturnFlight.arriveCode}
                                            </p>
                                            <p className="text-sm text-[#64748B]">
                                                {itinerary.flights.selectedReturnFlight.departTime} – {itinerary.flights.selectedReturnFlight.arriveTime} · {itinerary.flights.selectedReturnFlight.duration} · {formatFlightStopLabel(itinerary.flights.selectedReturnFlight)}
                                            </p>
                                            {itinerary.flights.selectedReturnFlight.stops && itinerary.flights.selectedReturnFlight.stops.length > 0 && (
                                                <div className="mt-3 pt-3 border-t border-white/10">
                                                    <p className="text-xs text-[#94A3B8] mb-1">Quá cảnh</p>
                                                    {itinerary.flights.selectedReturnFlight.stops.map((stop: { iata: string; name: string; arrival: string; departure: string }, i: number) => (
                                                        <div key={i} className="text-xs text-[#64748B] py-1">
                                                            <span className="font-medium text-[#475569]">{stop.iata}</span> {stop.name}
                                                            <br />
                                                            <span className="text-[#94A3B8]">Arrival: {new Date(stop.arrival).toLocaleString("vi-VN")}</span>
                                                            <br />
                                                            <span className="text-[#94A3B8]">Departure: {new Date(stop.departure).toLocaleString("vi-VN")}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <p className="mt-2 font-bold text-[#5FCBC4]">
                                                {itinerary.flights.selectedReturnFlight.price >= 1000
                                                    ? `${new Intl.NumberFormat("vi-VN").format(itinerary.flights.selectedReturnFlight.price)}đ`
                                                    : `$${itinerary.flights.selectedReturnFlight.price}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {itinerary.daily_itinerary.map((day) => {
                                const isExpanded = expandedDays.has(day.day_number)

                                return (
                                    <div key={day.day_number} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden">
                                        {/* Day Header - Clickable */}
                                        <button
                                            onClick={() => toggleDay(day.day_number)}
                                            className="w-full p-6 bg-gradient-to-r from-[#5FCBC4]/20 to-[#4AB8B0]/10 border-b border-white/10 hover:from-[#5FCBC4]/30 hover:to-[#4AB8B0]/20 transition-all"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-5 h-5 text-[#5FCBC4]" />
                                                    ) : (
                                                        <ChevronUp className="w-5 h-5 text-[#5FCBC4]" />
                                                    )}
                                                    <div className="text-left">
                                                        <p className="text-sm uppercase tracking-widest text-[#5FCBC4] mb-1">
                                                            Day {day.day_number}
                                                        </p>
                                                        <h2 className="text-2xl font-bold">{formatDate(day.date)}</h2>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-[#64748B]">Estimated Cost</p>
                                                    <p className="text-2xl font-bold text-[#5FCBC4]">${day.day_cost}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex gap-4 text-sm text-[#475569]">
                                                <span>{day.blocks.length} activities</span>
                                                <span>•</span>
                                                <span>Full day planned</span>
                                            </div>
                                        </button>

                                        {/* Day Content - Collapsible */}
                                        {isExpanded && (
                                            <div className="p-6">
                                                {/* Timeline */}
                                                <div className="relative">
                                                    {/* Timeline Line */}
                                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#5FCBC4] via-[#4AB8B0] to-[#5FCBC4]/20" />

                                                    <div className="space-y-6">
                                                        {day.blocks.map((block, idx) => {
                                                            const blockKey = `${day.day_number}-${idx}`
                                                            const isBlockExpanded = expandedBlocks.has(blockKey)
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
                                                                        {isBlockExpanded && (
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
                                                                                                        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
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
                                                                        {block.transport_to_next && idx < day.blocks.length - 1 && (
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
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
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

export default function FullTourPage() {
    return (
        <AuthGuard>
            <FullTourContent />
        </AuthGuard>
    )
}

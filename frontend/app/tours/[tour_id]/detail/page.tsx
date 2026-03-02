"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { TourService, TourDocument, TourDay, TourActivity } from "@/services/tour.service"

// Helper: format date
function formatDate(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        })
    } catch {
        return dateStr
    }
}

// Helper: render star rating
function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
    const sizeClass = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5"
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <svg
                    key={star}
                    className={`${sizeClass} ${star <= Math.round(rating) ? "text-amber-400" : "text-[#E4E4E7]"}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
            ))}
            <span className={`font-semibold ${size === "md" ? "text-base ml-1" : "text-xs ml-0.5"} text-[#3F3F46]`}>
                {rating.toFixed(1)}
            </span>
        </div>
    )
}

// Activity type badge
function ActivityBadge({ type, meal }: { type: string; meal?: string }) {
    if (type === "restaurant") {
        const mealLabel = meal ? meal.charAt(0).toUpperCase() + meal.slice(1) : "Dining"
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-semibold border border-orange-100">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                {mealLabel}
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#CCFBF1] text-[#0F4C5C] text-xs font-semibold border border-[#5FCBC4]/20">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Attraction
        </span>
    )
}

export default function TourDetailPage() {
    const router = useRouter()
    const params = useParams()
    const tourId = params.tour_id as string

    const [tour, setTour] = useState<TourDocument | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeDay, setActiveDay] = useState(1)
    const [activeImageIndex, setActiveImageIndex] = useState(0)

    // Fetch tour data
    useEffect(() => {
        const fetchTour = async () => {
            if (!tourId) return
            try {
                setLoading(true)
                setError("")
                const data = await TourService.getTour(tourId)
                setTour(data)
            } catch (err: any) {
                console.error("Error fetching tour:", err)
                if (err.message?.includes("401")) {
                    router.push("/login")
                    return
                }
                setError(err.message || "Failed to load tour details.")
            } finally {
                setLoading(false)
            }
        }
        fetchTour()
    }, [tourId, router])

    // Auto-cycle hotel images
    useEffect(() => {
        if (!tour?.accommodation?.images?.length) return
        const interval = setInterval(() => {
            setActiveImageIndex((prev) => (prev + 1) % tour.accommodation.images.length)
        }, 5000)
        return () => clearInterval(interval)
    }, [tour])

    // Current day data
    const currentDay = useMemo(() => {
        if (!tour?.itinerary) return null
        return tour.itinerary.find((d: any) => d.day_number === activeDay) || tour.itinerary[0]
    }, [tour, activeDay])

    // Total activities count
    const totalActivities = useMemo(() => {
        if (!tour?.itinerary) return 0
        return tour.itinerary.reduce((sum: number, day: any) => sum + (day.activities?.length || 0), 0)
    }, [tour])

    return (
        <AuthGuard>
            <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">

                {/* Background */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,251,241,0.4)_0%,rgba(240,253,250,0)_60%)]" />
                </div>

                {/* Header */}
                <header className="border-b border-[#E4E4E7] bg-[#F0FDFA]/95 backdrop-blur-md sticky top-0 z-50">
                    <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center justify-center w-9 h-9 rounded-xl border border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#5FCBC4] hover:text-[#0F4C5C] transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">
                                    VietJourney
                                </p>
                                <p className="text-sm font-semibold text-[#0F4C5C]">
                                    Tour Details
                                </p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                Home
                            </Link>
                            <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                Tours
                            </Link>
                            <Link href="/history_tour" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                History Tour
                            </Link>
                            <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
                            <UserMenu />
                        </nav>
                    </div>
                </header>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#5FCBC4] border-t-transparent rounded-full animate-spin" />
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Loading tour details...</h3>
                            <p className="text-[#A1A1AA]">Please wait a moment</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {!loading && error && (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center max-w-md">
                            <svg className="w-16 h-16 mx-auto mb-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Error Loading Tour</h3>
                            <p className="text-[#A1A1AA] mb-6">{error}</p>
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-medium hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition">
                                    Go Back
                                </button>
                                <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-[#5FCBC4] text-white font-semibold hover:bg-[#4AB8B0] transition">
                                    Retry
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!loading && !error && tour && (
                    <main className="mx-auto max-w-7xl px-6 py-8 pb-16">

                        {/* ===== HERO SECTION ===== */}
                        <div className="grid lg:grid-cols-2 gap-8 mb-10">

                            {/* Image Gallery */}
                            <div className="space-y-3">
                                {/* Main Image */}
                                <div className="relative rounded-2xl overflow-hidden h-80 lg:h-96 bg-[#E4E4E7]">
                                    {tour.accommodation?.images?.length > 0 ? (
                                        <>
                                            <img
                                                src={tour.accommodation.images[activeImageIndex]}
                                                alt={tour.title}
                                                className="w-full h-full object-cover transition-all duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                                            {/* Image counter */}
                                            <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-xs font-medium text-white">
                                                {activeImageIndex + 1} / {tour.accommodation.images.length}
                                            </div>

                                            {/* Nav arrows */}
                                            {tour.accommodation.images.length > 1 && (
                                                <>
                                                    <button
                                                        onClick={() => setActiveImageIndex((prev) => prev === 0 ? tour.accommodation.images.length - 1 : prev - 1)}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#0F4C5C] hover:bg-white transition shadow-md"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => setActiveImageIndex((prev) => (prev + 1) % tour.accommodation.images.length)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-[#0F4C5C] hover:bg-white transition shadow-md"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[#CCFBF1]">
                                            <svg className="w-16 h-16 text-[#5FCBC4]/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Thumbnail strip */}
                                {tour.accommodation?.images?.length > 1 && (
                                    <div className="flex gap-2">
                                        {tour.accommodation.images.map((img: string, idx: number) => (
                                            <button
                                                key={idx}
                                                onClick={() => setActiveImageIndex(idx)}
                                                className={`relative rounded-xl overflow-hidden h-20 flex-1 transition-all ${activeImageIndex === idx
                                                    ? "ring-2 ring-[#5FCBC4] ring-offset-2"
                                                    : "opacity-60 hover:opacity-100"
                                                    }`}
                                            >
                                                <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Tour Info */}
                            <div className="flex flex-col justify-between">
                                {/* Title & Location */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFBF1] text-[#0F4C5C] text-xs font-semibold">
                                            <svg className="w-3.5 h-3.5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {tour.destination.city}, {tour.destination.country}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {tour.duration_days} days
                                        </span>
                                    </div>

                                    <h1 className="text-3xl font-bold text-[#0F4C5C] mb-3 leading-tight">
                                        {tour.title}
                                    </h1>
                                    <p className="text-[#A1A1AA] text-base leading-relaxed mb-6">
                                        {tour.description}
                                    </p>

                                    {/* Quick Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 text-center">
                                            <div className="text-2xl font-bold text-[#5FCBC4]">{tour.duration_days}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">Days</div>
                                        </div>
                                        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 text-center">
                                            <div className="text-2xl font-bold text-[#0F4C5C]">{totalActivities}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">Activities</div>
                                        </div>
                                        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 text-center">
                                            <div className="text-2xl font-bold text-[#3F3F46]">${tour.pricing?.total || 0}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">Total Cost</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Accommodation Card */}
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 transition hover:border-[#5FCBC4] hover:shadow-md">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="text-sm font-semibold text-[#0F4C5C]">Accommodation</h3>
                                    </div>
                                    <h4 className="text-lg font-bold text-[#3F3F46] mb-2">{tour.accommodation?.hotel_name || "Not specified"}</h4>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {tour.accommodation?.hotel_rating && (
                                            <StarRating rating={tour.accommodation.hotel_rating} />
                                        )}
                                        {tour.accommodation?.price_per_night && (
                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#5FCBC4]">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ${tour.accommodation.price_per_night}/night
                                            </span>
                                        )}
                                        <span className="text-sm text-[#A1A1AA]">
                                            {tour.duration_days} nights · ${(tour.accommodation?.price_per_night || 0) * tour.duration_days} total
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ===== DAILY ITINERARY ===== */}
                        <section className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#0F4C5C]">Daily Itinerary</h2>
                                    <p className="text-sm text-[#A1A1AA]">Your day-by-day travel plan</p>
                                </div>
                            </div>

                            {/* Day Tabs */}
                            <div className="flex flex-wrap gap-2 mb-6">
                                {tour.itinerary?.map((day: any) => (
                                    <button
                                        key={day.day_number}
                                        onClick={() => setActiveDay(day.day_number)}
                                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${activeDay === day.day_number
                                            ? "bg-[#5FCBC4] text-white shadow-lg shadow-[#5FCBC4]/25"
                                            : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]"
                                            }`}
                                    >
                                        <span className="font-bold">Day {day.day_number}</span>
                                        {day.date && (
                                            <span className={`ml-2 text-xs ${activeDay === day.day_number ? "text-white/70" : "text-[#A1A1AA]"}`}>
                                                {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Current Day Card */}
                            {currentDay && (
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden">
                                    {/* Day Header */}
                                    <div className="px-6 py-5 bg-gradient-to-r from-[#F0FDFA] to-white border-b border-[#E4E4E7]">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-[#0F4C5C]">
                                                    Day {(currentDay as any).day_number} — {(currentDay as any).theme}
                                                </h3>
                                                {(currentDay as any).date && (
                                                    <p className="text-sm text-[#A1A1AA] mt-1">
                                                        {formatDate((currentDay as any).date)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xl font-bold text-[#5FCBC4]">
                                                    ${(currentDay as any).estimated_daily_cost || 0}
                                                </div>
                                                <div className="text-xs text-[#A1A1AA]">Daily cost</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activities Timeline */}
                                    <div className="p-6">
                                        <div className="space-y-0">
                                            {(currentDay as any).activities?.map((activity: any, index: number) => (
                                                <div key={index} className="relative flex gap-4">
                                                    {/* Timeline line */}
                                                    <div className="flex flex-col items-center">
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${activity.type === "restaurant"
                                                            ? "bg-orange-50 border-2 border-orange-200"
                                                            : "bg-[#CCFBF1] border-2 border-[#5FCBC4]/30"
                                                            }`}>
                                                            {activity.type === "restaurant" ? (
                                                                <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                        {index < (currentDay as any).activities.length - 1 && (
                                                            <div className="w-0.5 h-full min-h-[24px] bg-[#E4E4E7] my-1" />
                                                        )}
                                                    </div>

                                                    {/* Activity Content */}
                                                    <div className={`flex-1 pb-6 ${index < (currentDay as any).activities.length - 1 ? "" : "pb-0"}`}>
                                                        <div className="rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 transition hover:border-[#5FCBC4]/40 hover:bg-white hover:shadow-sm">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-bold text-[#0F4C5C]">{activity.time}</span>
                                                                    <span className="text-xs text-[#A1A1AA]">·</span>
                                                                    <span className="text-xs text-[#A1A1AA]">{activity.duration_hours}h</span>
                                                                </div>
                                                                <ActivityBadge type={activity.type} meal={activity.meal} />
                                                            </div>
                                                            <h4 className="text-base font-semibold text-[#3F3F46] mb-2">
                                                                {activity.name}
                                                            </h4>
                                                            <div className="flex items-center gap-4 flex-wrap">
                                                                <div className="flex items-center gap-1">
                                                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                                    </svg>
                                                                    <span className="text-sm font-medium text-[#3F3F46]">{activity.rating}</span>
                                                                </div>
                                                                <span className="text-sm font-semibold text-[#5FCBC4]">
                                                                    ${activity.estimated_cost}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* ===== PRICING BREAKDOWN ===== */}
                        <section className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#CCFBF1] flex items-center justify-center">
                                    <svg className="w-5 h-5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-[#0F4C5C]">Pricing Breakdown</h2>
                                    <p className="text-sm text-[#A1A1AA]">Detailed cost overview for your trip</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Individual Costs */}
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6">
                                    <div className="space-y-4">
                                        {[
                                            { label: "Accommodation", value: tour.pricing?.accommodation || 0, icon: "🏨", color: "text-blue-600", bg: "bg-blue-50" },
                                            { label: "Activities", value: tour.pricing?.activities || 0, icon: "🎯", color: "text-green-600", bg: "bg-green-50" },
                                            { label: "Transportation", value: tour.pricing?.transportation || 0, icon: "🚗", color: "text-purple-600", bg: "bg-purple-50" },
                                            { label: "Miscellaneous", value: tour.pricing?.misc || 0, icon: "📦", color: "text-amber-600", bg: "bg-amber-50" },
                                        ].map((item) => {
                                            const percentage = tour.pricing?.total ? Math.round((item.value / tour.pricing.total) * 100) : 0
                                            return (
                                                <div key={item.label}>
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center text-sm`}>
                                                                {item.icon}
                                                            </span>
                                                            <span className="text-sm font-medium text-[#3F3F46]">{item.label}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-[#A1A1AA]">{percentage}%</span>
                                                            <span className="text-sm font-bold text-[#3F3F46]">${item.value}</span>
                                                        </div>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="h-2 rounded-full bg-[#F0FDFA] overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-[#5FCBC4] transition-all duration-700"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Total Summary Card */}
                                <div className="rounded-2xl border border-[#5FCBC4]/30 bg-gradient-to-br from-[#F0FDFA] to-white p-6 flex flex-col justify-between">
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">Total Trip Cost</h3>
                                        <div className="text-5xl font-bold text-[#0F4C5C] mb-2">
                                            ${tour.pricing?.total || 0}
                                        </div>
                                        <p className="text-sm text-[#A1A1AA] mb-6">
                                            For {tour.duration_days} days in {tour.destination.city}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm border-t border-[#E4E4E7] pt-3">
                                            <span className="text-[#A1A1AA]">Per day average</span>
                                            <span className="font-bold text-[#3F3F46]">
                                                ${tour.pricing?.total ? Math.round(tour.pricing.total / tour.duration_days) : 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">Created on</span>
                                            <span className="font-medium text-[#3F3F46]">{formatDate(tour.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* ===== FOOTER ACTIONS ===== */}
                        <div className="flex items-center justify-between pt-6 border-t border-[#E4E4E7]">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-medium hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Tours
                            </button>
                            <Link
                                href="/planner"
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#5FCBC4] text-white font-semibold hover:bg-[#4AB8B0] transition shadow-lg shadow-[#5FCBC4]/25"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Plan New Tour
                            </Link>
                        </div>

                    </main>
                )}

                {/* Footer */}
                <footer className="mt-8 border-t border-[#E4E4E7] bg-[#1E293B] py-10">
                    <div className="mx-auto max-w-7xl px-6 text-center text-sm text-[#94A3B8]">
                        <p>© {new Date().getFullYear()} VietJourney. All rights reserved</p>
                        <p className="mt-2">Crafting unforgettable travel experiences.</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

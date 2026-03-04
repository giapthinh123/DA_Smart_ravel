"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter, useParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { TourService, TourDocument, TourDay, TourActivity } from "@/services/tour.service"
import { PaymentService } from "@/services/payment.service"
import { ItineraryService } from "@/services/itinerary.service"
import { useTranslations } from "next-intl"
import { toast } from "@/lib/toast"
import { useAuthStore } from "@/store/useAuthStore"

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
    const t = useTranslations("TourDetailPage")
    if (type === "restaurant") {
        const mealLabel = meal ? meal.charAt(0).toUpperCase() + meal.slice(1) : t("restaurant")
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
            {t("attraction")}
        </span>
    )
}

export default function TourDetailPage() {
    const t = useTranslations("TourDetailPage")
    const router = useRouter()
    const params = useParams()
    const tourId = params.tour_id as string
    const { isAuthenticated } = useAuthStore()
    const [tour, setTour] = useState<TourDocument | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [activeDay, setActiveDay] = useState(1)
    const [activeImageIndex, setActiveImageIndex] = useState(0)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentLoading, setPaymentLoading] = useState(false)
    const [savingTour, setSavingTour] = useState(false)
    const [tourSaved, setTourSaved] = useState(false)

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

    // Handle payment
    const handlePayment = async () => {
        if (!tour) return

        try {
            setPaymentLoading(true)

            // Create VNPAY payment URL
            const result = await PaymentService.createVnpayPaymentUrl({
                itinerary_id: tour.tour_id,
                amount_usd: tour.pricing?.total || 0,
                order_info: `Thanh toan tour ${tour.title}`,
                language: 'vn'
            })

            // Redirect to VNPAY payment page
            window.location.href = result.payment_url

        } catch (err: any) {
            console.error("Payment error:", err)
            toast.error(err.message || t("paymentError"))
            setPaymentLoading(false)
        }
    }

    const handleSaveTour = async () => {
        if (!tour) return
        try {
            setSavingTour(true)
            await ItineraryService.savePremadeTour(tour.tour_id)
            setTourSaved(true)
            toast.success(t("tourSavedSuccess"))
        } catch (err: any) {
            if (err.message?.includes("already saved")) {
                setTourSaved(true)
                toast.success(t("tourAlreadySaved"))
            } else {
                toast.error(err.message || t("tourSaveError"))
            }
        } finally {
            setSavingTour(false)
        }
    }

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
                                    {t("pageTitle")}
                                </p>
                            </div>
                        </div>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                {t("home")}
                            </Link>
                            <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                {t("tours")}
                            </Link>
                            <Link href="/history_tour" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                {t("historyTour")}
                            </Link>
                            {isAuthenticated ? (
                                <>
                                    <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
                                    <UserMenu />
                                </>
                            ) : (
                                <Link href="/login" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                    {t("login")}
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#5FCBC4] border-t-transparent rounded-full animate-spin" />
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">{t("loadingTitle")}</h3>
                            <p className="text-[#A1A1AA]">{t("loadingDesc")}</p>
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
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">{t("errorTitle")}</h3>
                            <p className="text-[#A1A1AA] mb-6">{error}</p>
                            <div className="flex items-center justify-center gap-3">
                                <button onClick={() => router.back()} className="px-5 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-medium hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition">
                                    {t("goBack")}
                                </button>
                                <button onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-xl bg-[#5FCBC4] text-white font-semibold hover:bg-[#4AB8B0] transition">
                                    {t("retry")}
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
                                            {tour.duration_days} {t("days")}
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
                                            <div className="text-xs text-[#A1A1AA] mt-1">{t("days")}</div>
                                        </div>
                                        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 text-center">
                                            <div className="text-2xl font-bold text-[#0F4C5C]">{totalActivities}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">{t("activities")}</div>
                                        </div>
                                        <div className="rounded-xl border border-[#E4E4E7] bg-white p-4 text-center">
                                            <div className="text-2xl font-bold text-[#3F3F46]">${tour.pricing?.total || 0}</div>
                                            <div className="text-xs text-[#A1A1AA] mt-1">{t("totalCost")}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Accommodation Card */}
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white p-5 transition hover:border-[#5FCBC4] hover:shadow-md">
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className="w-5 h-5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="text-sm font-semibold text-[#0F4C5C]">{t("accommodation")}</h3>
                                    </div>
                                    <h4 className="text-lg font-bold text-[#3F3F46] mb-2">{tour.accommodation?.hotel_name || t("notSpecified")}</h4>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        {tour.accommodation?.hotel_rating && (
                                            <StarRating rating={tour.accommodation.hotel_rating} />
                                        )}
                                        {tour.accommodation?.price_per_night && (
                                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#5FCBC4]">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                ${tour.accommodation.price_per_night}{t("perNight")}
                                            </span>
                                        )}
                                        <span className="text-sm text-[#A1A1AA]">
                                            {tour.duration_days} {t("nights")} · ${(tour.accommodation?.price_per_night || 0) * tour.duration_days} {t("total")}
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
                                    <h2 className="text-2xl font-bold text-[#0F4C5C]">{t("dailyItinerary")}</h2>
                                    <p className="text-sm text-[#A1A1AA]">{t("dailyItineraryDesc")}</p>
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
                                        <span className="font-bold">{t("day")} {day.day_number}</span>
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
                                                    {t("day")} {(currentDay as any).day_number} — {(currentDay as any).theme}
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
                                                <div className="text-xs text-[#A1A1AA]">{t("dailyCost")}</div>
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
                                    <h2 className="text-2xl font-bold text-[#0F4C5C]">{t("pricingBreakdown")}</h2>
                                    <p className="text-sm text-[#A1A1AA]">{t("pricingDesc")}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Individual Costs */}
                                <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6">
                                    <div className="space-y-4">
                                        {[
                                            { label: t("costAccommodation"), value: tour.pricing?.accommodation || 0, icon: "🏨", color: "text-blue-600", bg: "bg-blue-50" },
                                            { label: t("costActivities"), value: tour.pricing?.activities || 0, icon: "🎯", color: "text-green-600", bg: "bg-green-50" },
                                            { label: t("costTransportation"), value: tour.pricing?.transportation || 0, icon: "🚗", color: "text-purple-600", bg: "bg-purple-50" },
                                            { label: t("costMisc"), value: tour.pricing?.misc || 0, icon: "📦", color: "text-amber-600", bg: "bg-amber-50" },
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
                                        <h3 className="text-sm font-semibold text-[#A1A1AA] uppercase tracking-wider mb-3">{t("totalTripCost")}</h3>
                                        <div className="text-5xl font-bold text-[#0F4C5C] mb-2">
                                            ${tour.pricing?.total || 0}
                                        </div>
                                        <p className="text-sm text-[#A1A1AA] mb-6">
                                            {t("for")} {tour.duration_days} {t("days")} {t("in")} {tour.destination.city}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm border-t border-[#E4E4E7] pt-3">
                                            <span className="text-[#A1A1AA]">{t("perDayAverage")}</span>
                                            <span className="font-bold text-[#3F3F46]">
                                                ${tour.pricing?.total ? Math.round(tour.pricing.total / tour.duration_days) : 0}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">{t("createdOn")}</span>
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
                                {t("backToTours")}
                            </button>
                            <div className="flex items-center gap-3">
                                {/* Save Tour Button */}
                                {tourSaved ? (
                                    <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 font-semibold">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                        {t("tourSaved")}
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleSaveTour}
                                        disabled={savingTour}
                                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-medium hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {savingTour ? (
                                            <div className="w-4 h-4 border-2 border-[#3F3F46] border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                            </svg>
                                        )}
                                        {t("saveTour")}
                                    </button>
                                )}
                                <button
                                    onClick={() => setShowPaymentModal(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] text-white font-semibold hover:shadow-lg hover:shadow-[#5FCBC4]/30 transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                    </svg>
                                    {t("payNow")}
                                </button>

                            </div>
                        </div>

                    </main>
                )}

                {/* Payment Modal */}
                {showPaymentModal && tour && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            {/* Modal Header */}
                            <div className="sticky top-0 bg-white border-b border-[#E4E4E7] px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-bold text-[#0F4C5C]">{t("paymentTitle")}</h3>
                                    <p className="text-sm text-[#A1A1AA] mt-1">{t("paymentSubtitle")}</p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#F0FDFA] text-[#A1A1AA] hover:text-[#0F4C5C] transition"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 space-y-6">
                                {/* Tour Summary */}
                                <div className="rounded-xl border border-[#E4E4E7] bg-[#F0FDFA] p-4">
                                    <h4 className="text-sm font-semibold text-[#0F4C5C] mb-3">{t("tourSummary")}</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-start justify-between">
                                            <span className="text-sm text-[#A1A1AA]">{t("tourName")}</span>
                                            <span className="text-sm font-medium text-[#3F3F46] text-right max-w-[60%]">{tour.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[#A1A1AA]">{t("destination")}</span>
                                            <span className="text-sm font-medium text-[#3F3F46]">{tour.destination.city}, {tour.destination.country}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[#A1A1AA]">{t("duration")}</span>
                                            <span className="text-sm font-medium text-[#3F3F46]">{tour.duration_days} {t("days")}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-[#A1A1AA]">{t("activities")}</span>
                                            <span className="text-sm font-medium text-[#3F3F46]">{totalActivities} {t("activities")}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-[#0F4C5C]">{t("priceBreakdown")}</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">{t("costAccommodation")}</span>
                                            <span className="font-medium text-[#3F3F46]">${tour.pricing?.accommodation || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">{t("costActivities")}</span>
                                            <span className="font-medium text-[#3F3F46]">${tour.pricing?.activities || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">{t("costTransportation")}</span>
                                            <span className="font-medium text-[#3F3F46]">${tour.pricing?.transportation || 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-[#A1A1AA]">{t("costMisc")}</span>
                                            <span className="font-medium text-[#3F3F46]">${tour.pricing?.misc || 0}</span>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t-2 border-[#E4E4E7] flex items-center justify-between">
                                        <span className="text-base font-bold text-[#0F4C5C]">{t("totalAmount")}</span>
                                        <span className="text-2xl font-bold text-[#5FCBC4]">${tour.pricing?.total || 0}</span>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="rounded-xl border border-[#E4E4E7] bg-white p-4">
                                    <h4 className="text-sm font-semibold text-[#0F4C5C] mb-3">{t("paymentMethod")}</h4>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F0FDFA] border border-[#5FCBC4]/30">
                                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border border-[#E4E4E7]">
                                            <img src="/vnpay-logo.png" alt="VNPAY" className="w-10 h-10 object-contain" onError={(e) => {
                                                e.currentTarget.style.display = 'none'
                                                e.currentTarget.parentElement!.innerHTML = '<span class="text-[#5FCBC4] font-bold text-xs">VNPAY</span>'
                                            }} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-[#0F4C5C]">VNPAY</p>
                                            <p className="text-xs text-[#A1A1AA]">{t("vnpayDesc")}</p>
                                        </div>
                                        <svg className="w-5 h-5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>

                                {/* Security Notice */}
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
                                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-blue-900">{t("securePayment")}</p>
                                        <p className="text-xs text-blue-700 mt-1">{t("securePaymentDesc")}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 bg-white border-t border-[#E4E4E7] px-6 py-4 flex items-center gap-3 rounded-b-2xl">
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    disabled={paymentLoading}
                                    className="flex-1 px-5 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-medium hover:bg-[#F0FDFA] transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t("cancel")}
                                </button>
                                <button
                                    onClick={handlePayment}
                                    disabled={paymentLoading}
                                    className="flex-1 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0] text-white font-semibold hover:shadow-lg hover:shadow-[#5FCBC4]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {paymentLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            {t("processing")}
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                            </svg>
                                            {t("proceedToPayment")}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <footer className="mt-8 border-t border-[#E4E4E7] bg-[#1E293B] py-10">
                    <div className="mx-auto max-w-7xl px-6 text-center text-sm text-[#94A3B8]">
                        <p>© {new Date().getFullYear()} {t("copyright")}</p>
                        <p className="mt-2">{t("tagline")}</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

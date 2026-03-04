"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslations } from "next-intl"
import { ItineraryService, BookingHistoryItem } from "@/services/itinerary.service"
import { useAuthStore } from "@/store/useAuthStore"
interface TourHistory {
    id: string
    booking_id: string
    tour_type: "itinerary" | "premade_tour"
    status: "Paid" | "Created" | "Planning" | "Saved"
    name: string
    destination: string
    dates: string
    travelers: string
    budget: string
    image: string
    activities: number
    rating?: number
}

export default function HistoryTourPage() {
    const router = useRouter()
    const t = useTranslations("HistoryTourPage")
    const [filter, setFilter] = useState<string>("All")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [tourHistory, setTourHistory] = useState<TourHistory[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 9
    const { isAuthenticated } = useAuthStore()

    // Fetch tour history from API using unified booking history
    useEffect(() => {
        const fetchTourHistory = async () => {
            try {
                setLoading(true)
                setError("")

                const data = await ItineraryService.getBookingHistory({
                    status: filter !== "All" ? filter : undefined,
                    limit: 100
                })

                if (!data || !Array.isArray(data.history)) {
                    console.warn("Invalid response format:", data)
                    setTourHistory([])
                    return
                }

                const transformedHistory: TourHistory[] = data.history.map((item: BookingHistoryItem) => {
                    let status: TourHistory["status"] = "Planning"
                    const itemStatus = (item.status || "").toLowerCase()

                    if (itemStatus === "paid") status = "Paid"
                    else if (itemStatus === "created") status = "Created"
                    else if (itemStatus === "saved") status = "Saved"
                    else status = "Planning"

                    return {
                        id: item.id || "",
                        booking_id: item.booking_id || "",
                        tour_type: item.tour_type || "itinerary",
                        status: status,
                        name: item.name || "Unnamed Tour",
                        destination: item.destination || "Unknown",
                        dates: item.dates || "",
                        travelers: item.travelers || "1 guests",
                        budget: item.budget || "$0",
                        image: item.image || "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
                        activities: item.activities || 0,
                        rating: item.rating || undefined
                    }
                })

                setTourHistory(transformedHistory)
            } catch (err: any) {
                console.error("Error fetching tour history:", err)
                if (err.message?.includes("401") || err.message?.includes("unauthorized")) {
                    router.push("/login")
                    return
                }
                setError(err.message || "Failed to load tour history. Please try again.")
                setTourHistory([])
            } finally {
                setLoading(false)
            }
        }

        fetchTourHistory()
    }, [router, filter])

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Paid":
                return "bg-[#CCFBF1] text-[#0F4C5C] border-[#5FCBC4]/40"
            case "Created":
                return "bg-blue-50 text-blue-600 border-blue-200"
            case "Planning":
                return "bg-amber-50 text-amber-600 border-amber-200"
            case "Saved":
                return "bg-purple-50 text-purple-600 border-purple-200"
            default:
                return "bg-[#E4E4E7] text-[#A1A1AA] border-[#E4E4E7]"
        }
    }

    // Client-side filtering for search (status filter is handled by backend)
    const filteredTours = tourHistory.filter(tour => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return tour.name.toLowerCase().includes(query) ||
            tour.destination.toLowerCase().includes(query)
    })

    // Pagination logic
    const totalPages = Math.ceil(filteredTours.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTours = filteredTours.slice(startIndex, endIndex)

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [filter, searchQuery])

    const filterOptions = ["All", "Paid", "Created", "Planning", "Saved"]
    const stats = {
        total: tourHistory.length,
        paid: tourHistory.filter(t => t.status === "Paid").length,
        created: tourHistory.filter(t => t.status === "Created").length,
        planning: tourHistory.filter(t => t.status === "Planning").length,
        saved: tourHistory.filter(t => t.status === "Saved").length,
    }

    return (
        <AuthGuard>
            <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">

                {/* Header */}
                <header className="border-b border-[#E4E4E7] bg-[#F0FDFA]/95 backdrop-blur-md sticky top-0 z-50">
                    <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">
                                VietJourney
                            </p>
                            <p className="text-sm font-semibold text-[#0F4C5C]">
                                {t("historyTour")}
                            </p>
                        </div>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                {t("home")}
                            </Link>
                            <Link href="/history_tour" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                {t("historyTour")}
                            </Link>
                            <>
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
                            </>
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-[#0F4C5C] mb-3">
                            {t("pageTitle")}
                        </h1>
                        <p className="text-[#A1A1AA] text-lg">
                            {t("pageDesc")}
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#5FCBC4] mb-2">{stats.total}</div>
                            <div className="text-sm text-[#A1A1AA]">{t("stats.totalTours")}</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#0F4C5C] mb-2">{stats.paid}</div>
                            <div className="text-sm text-[#A1A1AA]">{t("stats.paid")}</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.created}</div>
                            <div className="text-sm text-[#A1A1AA]">{t("stats.created")}</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-amber-600 mb-2">{stats.planning}</div>
                            <div className="text-sm text-[#A1A1AA]">{t("stats.planning")}</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.saved}</div>
                            <div className="text-sm text-[#A1A1AA]">{t("stats.saved")}</div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Filter Chips */}
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map((option) => {
                                const filterKeyMap: Record<string, string> = {
                                    "All": "all",
                                    "Paid": "paid",
                                    "Created": "created",
                                    "Planning": "planning",
                                    "Saved": "saved",
                                }
                                const filterKey = filterKeyMap[option] || "all"
                                return (
                                    <button
                                        key={option}
                                        onClick={() => setFilter(option)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === option
                                            ? "bg-[#5FCBC4] text-[#FFFFFF]"
                                            : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]"
                                            }`}
                                    >
                                        {t(`filters.${filterKey}`)}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder={t("searchPlaceholder")}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-[#3F3F46] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#5FCBC4] focus:ring-2 focus:ring-[#5FCBC4]/20 transition"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-20 rounded-2xl border border-[#E4E4E7] bg-white">
                            <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#5FCBC4] border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">{t("loadingTitle")}</h3>
                            <p className="text-[#A1A1AA]">{t("loadingDesc")}</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20 rounded-2xl border border-red-200 bg-red-50">
                            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">{t("errorTitle")}</h3>
                            <p className="text-[#A1A1AA] mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 rounded-lg bg-[#5FCBC4] text-[#FFFFFF] font-semibold hover:bg-[#4AB8B0] transition"
                            >
                                {t("retry")}
                            </button>
                        </div>
                    )}

                    {/* Tours Grid */}
                    {!loading && !error && filteredTours.length === 0 && (
                        <div className="text-center py-20 rounded-2xl border border-[#E4E4E7] bg-white">
                            <svg className="w-16 h-16 mx-auto mb-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">{t("noToursFound")}</h3>
                            <p className="text-[#A1A1AA] mb-4">{t("adjustFilters")}</p>
                            <Link
                                href="/tours"
                                className="inline-block px-6 py-2 rounded-lg bg-[#5FCBC4] text-[#FFFFFF] font-semibold hover:bg-[#4AB8B0] transition"
                            >
                                {t("createNewTour")}
                            </Link>
                        </div>
                    )}

                    {!loading && !error && filteredTours.length > 0 && (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentTours.map((tour) => {
                                    const canEdit =
                                        tour.tour_type === "itinerary" &&
                                        (tour.status === "Planning" || tour.status === "Created")

                                    const handleCardClick = () => {
                                        if (tour.tour_type === "premade_tour") {
                                            router.push(`/tours/${tour.id}/detail`)
                                        } else {
                                            router.push(`/full_tour?itineraryId=${tour.id}`)
                                        }
                                    }

                                    const handleEditClick = (e: React.MouseEvent) => {
                                        e.stopPropagation()
                                        if (!canEdit) return
                                        router.push(`/itinerary/edit?bookingId=${tour.booking_id}`)
                                    }

                                    return (
                                        <div
                                            key={tour.id}
                                            className="group rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden transition-all hover:border-[#5FCBC4] hover:shadow-md cursor-pointer"
                                            onClick={handleCardClick}
                                        >
                                            {/* Image */}
                                            <div className="relative h-48 overflow-hidden">
                                                <img
                                                    src={tour.image}
                                                    alt={tour.name}
                                                    width={400}
                                                    height={192}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                />
                                                <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />

                                                {/* Status Badge */}
                                                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tour.status)}`}>
                                                    {tour.status}
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-6">
                                                <h3 className="text-lg font-semibold text-[#0F4C5C] mb-2 group-hover:text-[#5FCBC4] transition">
                                                    {tour.name}
                                                </h3>

                                                <div className="space-y-2 mb-4">
                                                    <div className="flex items-center text-sm text-[#A1A1AA]">
                                                        <svg className="w-4 h-4 mr-2 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span className="text-[#3F3F46]">{tour.destination}</span>
                                                    </div>
                                                    <div className="flex items-center text-sm text-[#A1A1AA]">
                                                        <svg className="w-4 h-4 mr-2 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {tour.dates}
                                                    </div>
                                                    <div className="flex items-center text-sm text-[#A1A1AA]">
                                                        <svg className="w-4 h-4 mr-2 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                        </svg>
                                                        {tour.travelers}
                                                    </div>
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7]">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-lg font-bold text-[#5FCBC4]">{tour.budget}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {canEdit && (
                                                            <button
                                                                onClick={handleEditClick}
                                                                className="px-3 py-1.5 text-xs font-semibold rounded-full border border-[#5FCBC4] text-[#0F4C5C] bg-[#CCFBF1] hover:bg-[#5FCBC4] hover:text-white transition"
                                                            >
                                                                Edit Tour
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex flex-col items-center gap-6">
                                    {/* Page Info */}
                                    <p className="text-sm text-[#A1A1AA]">
                                        Showing {startIndex + 1}-{Math.min(endIndex, filteredTours.length)} of {filteredTours.length} tours
                                    </p>

                                    {/* Pagination Buttons */}
                                    <div className="flex items-center gap-2">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === 1
                                                ? "border border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed"
                                                : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4] hover:text-[#5FCBC4]"
                                                }`}
                                            aria-label="Previous page"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        {/* Page Numbers */}
                                        <div className="flex items-center gap-2">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                                const showPage =
                                                    page === 1 ||
                                                    page === totalPages ||
                                                    Math.abs(page - currentPage) <= 1

                                                const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                                                const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2

                                                if (showEllipsisBefore || showEllipsisAfter) {
                                                    return (
                                                        <span key={page} className="px-2 text-[#A1A1AA]">
                                                            ...
                                                        </span>
                                                    )
                                                }

                                                if (!showPage) return null

                                                return (
                                                    <button
                                                        key={page}
                                                        onClick={() => setCurrentPage(page)}
                                                        className={`min-w-[40px] h-10 rounded-lg font-medium transition-all ${currentPage === page
                                                            ? "bg-[#5FCBC4] text-[#FFFFFF]"
                                                            : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4] hover:text-[#5FCBC4]"
                                                            }`}
                                                        aria-label={`Go to page ${page}`}
                                                        aria-current={currentPage === page ? "page" : undefined}
                                                    >
                                                        {page}
                                                    </button>
                                                )
                                            })}
                                        </div>

                                        {/* Next Button */}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${currentPage === totalPages
                                                ? "border border-[#E4E4E7] text-[#A1A1AA] cursor-not-allowed"
                                                : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4] hover:text-[#5FCBC4]"
                                                }`}
                                            aria-label="Next page"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </main>

                {/* Footer */}
                <footer className="mt-8 border-t border-[#E4E4E7] bg-[#1E293B] py-10">
                    <div className="mx-auto max-w-7xl px-6 text-center text-sm text-[#94A3B8]">
                        <p>{t("copyright")}</p>
                        <p className="mt-2">{t("tagline")}</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

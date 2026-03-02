"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { ItineraryService, TourHistoryItem } from "@/services/itinerary.service"

interface TourHistory {
    id: string
    status: "Completed" | "In Progress" | "Payed" | "Pending"
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
    const [filter, setFilter] = useState<string>("All")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [tourHistory, setTourHistory] = useState<TourHistory[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const itemsPerPage = 9

    // Fetch tour history from API using ItineraryService
    useEffect(() => {
        const fetchTourHistory = async () => {
            try {
                setLoading(true)
                setError("")


                // Use ItineraryService to fetch tour history
                const data = await ItineraryService.getTourHistory({
                    status: filter !== "All" ? filter : undefined,
                    limit: 100

                })

                // Check if data has history array
                if (!data || !Array.isArray(data.history)) {
                    console.warn("Invalid response format:", data)
                    setTourHistory([])
                    return
                }

                // Transform API data to match TourHistory interface
                const transformedHistory: TourHistory[] = data.history.map((item: TourHistoryItem) => {
                    // Map status to proper format (backend already sends capitalized status)
                    let status: TourHistory["status"] = "Pending"
                    const itemStatus = (item.status || "").toLowerCase()

                    if (itemStatus.includes("complete")) status = "Completed"
                    else if (itemStatus.includes("progress") || itemStatus === "pending") status = "In Progress"
                    else if (itemStatus === "payed") status = "Payed"
                    else status = "Pending"

                    return {
                        id: item.id || "",
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
                // Check if error is auth-related
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
            case "Completed":
                return "bg-[#CCFBF1] text-[#0F4C5C] border-[#5FCBC4]/40"
            case "In Progress":
            case "Pending":
                return "bg-blue-50 text-blue-600 border-blue-200"
            case "Cancelled":
                return "bg-red-50 text-red-600 border-red-200"
            case "Payed":
                return "bg-amber-50 text-amber-600 border-amber-200"
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

    const filterOptions = ["All", "Completed", "In Progress", "Payed"]
    const stats = {
        total: tourHistory.length,
        completed: tourHistory.filter(t => t.status === "Completed").length,
        inProgress: tourHistory.filter(t => t.status === "In Progress" || t.status === "Pending").length,
        saved: tourHistory.filter(t => t.status === "Payed").length,
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
                                Your Travel Timeline
                            </p>
                        </div>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                Home
                            </Link>
                            <Link href="/history_tour" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                History Tour
                            </Link>
                            <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                Tours
                            </Link>
                            <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
                            <UserMenu />
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-6 py-8 pb-16">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-[#0F4C5C] mb-3">
                            Tour History
                        </h1>
                        <p className="text-[#A1A1AA] text-lg">
                            Explore your past adventures and planned journeys
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#5FCBC4] mb-2">{stats.total}</div>
                            <div className="text-sm text-[#A1A1AA]">Total Tours</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#0F4C5C] mb-2">{stats.completed}</div>
                            <div className="text-sm text-[#A1A1AA]">Completed</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#3F3F46] mb-2">{stats.inProgress}</div>
                            <div className="text-sm text-[#A1A1AA]">In Progress</div>
                        </div>
                        <div className="rounded-2xl border border-[#E4E4E7] bg-white p-6 transition hover:border-[#5FCBC4] hover:shadow-sm">
                            <div className="text-3xl font-bold text-[#3F3F46] mb-2">{stats.saved}</div>
                            <div className="text-sm text-[#A1A1AA]">Payed</div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Filter Chips */}
                        <div className="flex flex-wrap gap-2">
                            {filterOptions.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setFilter(option)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === option
                                        ? "bg-[#5FCBC4] text-[#FFFFFF]"
                                        : "border border-[#E4E4E7] text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tours or destinations..."
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
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Loading your tours...</h3>
                            <p className="text-[#A1A1AA]">Please wait a moment</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20 rounded-2xl border border-red-200 bg-red-50">
                            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Error Loading Tours</h3>
                            <p className="text-[#A1A1AA] mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 rounded-lg bg-[#5FCBC4] text-[#FFFFFF] font-semibold hover:bg-[#4AB8B0] transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Tours Grid */}
                    {!loading && !error && filteredTours.length === 0 && (
                        <div className="text-center py-20 rounded-2xl border border-[#E4E4E7] bg-white">
                            <svg className="w-16 h-16 mx-auto mb-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">No tours found</h3>
                            <p className="text-[#A1A1AA] mb-4">Try adjusting your filters or search query</p>
                            <Link
                                href="/tours"
                                className="inline-block px-6 py-2 rounded-lg bg-[#5FCBC4] text-[#FFFFFF] font-semibold hover:bg-[#4AB8B0] transition"
                            >
                                Create New Tour
                            </Link>
                        </div>
                    )}

                    {!loading && !error && filteredTours.length > 0 && (
                        <>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentTours.map((tour) => (
                                    <div
                                        key={tour.id}
                                        className="group rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden transition-all hover:border-[#5FCBC4] hover:shadow-md cursor-pointer"
                                        onClick={() => router.push(`/full_tour?itineraryId=${tour.id}`)}
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
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

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
                                                    <span className="text-xs text-[#A1A1AA]">·</span>
                                                    <span className="text-sm text-[#A1A1AA]">{tour.activities} activities</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
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
                        <p>© 2025 VietJourney. All rights reserved</p>
                        <p className="mt-2">Preserving your travel memories.</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

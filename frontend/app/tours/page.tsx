"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { TourService, TourDocument } from "@/services/tour.service"
import { useAuthStore } from "@/store/useAuthStore"
// Destination images map for beautiful cards
const DESTINATION_IMAGES: Record<string, string> = {
    "ha noi": "https://marketplace.canva.com/wgNe8/MAFaRvwgNe8/1/tl/canva-hoan-kiem-lake-MAFaRvwgNe8.jpg",
    "hanoi": "https://marketplace.canva.com/wgNe8/MAFaRvwgNe8/1/tl/canva-hoan-kiem-lake-MAFaRvwgNe8.jpg",
    "da nang": "https://media.vneconomy.vn/images/upload/2023/08/30/cau-vang-nag-tran-tuan-viet-5.jpg",
    "danang": "https://media.vneconomy.vn/images/upload/2023/08/30/cau-vang-nag-tran-tuan-viet-5.jpg",
    "ho chi minh": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    "hcm": "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    "paris": "https://c4.wallpaperflare.com/wallpaper/150/935/583/paris-4k-download-beautiful-for-desktop-wallpaper-preview.jpg",
    "tokyo": "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80",
    "london": "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80",
    "new york": "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80",
    "singapore": "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80",
    "bangkok": "https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80",
    "da lat": "https://images.unsplash.com/photo-1600071892851-f0af57be4009?w=800&q=80",
    "hue": "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
    "nha trang": "https://images.unsplash.com/photo-1573270689103-d7a4e42e3b09?w=800&q=80",
    "phu quoc": "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80",
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80"

function getDestinationImage(city: string): string {
    const key = city.toLowerCase().trim()
    return DESTINATION_IMAGES[key] || DEFAULT_IMAGE
}

type SortOption = "newest" | "oldest" | "price_high" | "price_low" | "duration"

export default function ToursPage() {
    const router = useRouter()
    const { isAuthenticated } = useAuthStore()
    const [tours, setTours] = useState<TourDocument[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string>("")
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [sortBy, setSortBy] = useState<SortOption>("newest")
    const [currentPage, setCurrentPage] = useState<number>(1)
    const [showSortDropdown, setShowSortDropdown] = useState(false)
    const itemsPerPage = 9

    // Fetch tours from API
    useEffect(() => {
        const fetchTours = async () => {
            try {
                setLoading(true)
                setError("")
                const data = await TourService.getAllTours()
                setTours(data || [])
            } catch (err: any) {
                console.error("Error fetching tours:", err)
                if (err.message?.includes("401") || err.message?.includes("unauthorized")) {
                    router.push("/login")
                    return
                }
                setError(err.message || "Failed to load tours. Please try again.")
                setTours([])
            } finally {
                setLoading(false)
            }
        }
        fetchTours()
    }, [router])

    // Filter & sort tours
    const processedTours = useMemo(() => {
        let result = [...tours]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(tour =>
                tour.title.toLowerCase().includes(query) ||
                tour.description.toLowerCase().includes(query) ||
                tour.destination.city.toLowerCase().includes(query) ||
                tour.destination.country.toLowerCase().includes(query)
            )
        }

        // Sort
        switch (sortBy) {
            case "newest":
                result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
            case "oldest":
                result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                break
            case "price_high":
                result.sort((a, b) => (b.pricing?.total || 0) - (a.pricing?.total || 0))
                break
            case "price_low":
                result.sort((a, b) => (a.pricing?.total || 0) - (b.pricing?.total || 0))
                break
            case "duration":
                result.sort((a, b) => (b.duration_days || 0) - (a.duration_days || 0))
                break
        }

        return result
    }, [tours, searchQuery, sortBy])

    // Pagination
    const totalPages = Math.ceil(processedTours.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentTours = processedTours.slice(startIndex, endIndex)

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, sortBy])

    // Stats
    const stats = {
        total: tours.length,
        destinations: new Set(tours.map(t => t.destination.city)).size,
        totalDays: tours.reduce((sum, t) => sum + (t.duration_days || 0), 0),
        avgBudget: tours.length > 0
            ? Math.round(tours.reduce((sum, t) => sum + (t.pricing?.total || 0), 0) / tours.length)
            : 0,
    }

    const sortOptions: { value: SortOption; label: string }[] = [
        { value: "newest", label: "Newest First" },
        { value: "oldest", label: "Oldest First" },
        { value: "price_high", label: "Price: High → Low" },
        { value: "price_low", label: "Price: Low → High" },
        { value: "duration", label: "Longest Duration" },
    ]

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            })
        } catch {
            return dateStr
        }
    }

    const formatPrice = (price: number) => {
        if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`
        return `$${price}`
    }

    return (
        <AuthGuard>
            <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">
                {/* Subtle background gradient */}
                <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,251,241,0.4)_0%,rgba(240,253,250,0)_60%)]" />
                    <div className="absolute top-[40%] right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,transparent_70%)]" />
                </div>

                {/* Header */}
                <header className="border-b border-[#E4E4E7] bg-[#F0FDFA]/95 backdrop-blur-md sticky top-0 z-50">
                    <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">
                                VietJourney
                            </p>
                            <p className="text-sm font-semibold text-[#0F4C5C]">
                                Explore All Tours
                            </p>
                        </div>
                        <nav className="flex items-center gap-2 text-sm font-medium">
                            <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                Home
                            </Link>
                            <Link href="/tours" className="rounded-full px-4 py-2 bg-[#CCFBF1] text-[#0F4C5C] font-semibold">
                                Tours
                            </Link>
                            <Link href="/history_tour" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                History Tour
                            </Link>
                            <>
                                {isAuthenticated ? (
                                    <>
                                        <span className="mx-2 h-4 w-px bg-[#E4E4E7]"></span>
                                        <UserMenu />
                                    </>
                                ) : (
                                    <Link href="/login" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                                        Login
                                    </Link>
                                )}
                            </>
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-6 py-8 pb-16">

                    {/* Hero Section */}
                    <div className="mb-10 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F4C5C] via-[#155E6C] to-[#0F4C5C] p-8 md:p-12 text-white">
                        <div className="absolute top-0 right-0 w-72 h-72 bg-[#5FCBC4]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                        <div className="absolute bottom-0 left-0 w-56 h-56 bg-[#5FCBC4]/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4" />
                        <div className="relative z-10">
                            <span className="inline-flex items-center gap-2 rounded-full border border-[#5FCBC4]/40 bg-[#5FCBC4]/15 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-[#5FCBC4] mb-4">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                </svg>
                                Tour Collection
                            </span>
                            <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">
                                Your Travel Tours
                            </h1>
                            <p className="text-white/70 text-base md:text-lg max-w-xl">
                                Browse and manage all your curated travel experiences. Each tour is a unique journey waiting to unfold.
                            </p>
                        </div>
                    </div>

                    {/* Search & Sort Controls */}
                    <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                        {/* Search Bar */}
                        <div className="relative w-full md:w-96">
                            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tours, cities, or countries..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E4E4E7] bg-white text-[#3F3F46] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#5FCBC4] focus:ring-2 focus:ring-[#5FCBC4]/20 transition shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[#E4E4E7] text-[#A1A1AA] hover:text-[#3F3F46] transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Sort Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                                    className="flex items-center gap-2 px-4 py-3 rounded-xl border border-[#E4E4E7] bg-white text-sm font-medium text-[#3F3F46] hover:border-[#5FCBC4] transition shadow-sm"
                                >
                                    <svg className="w-4 h-4 text-[#A1A1AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                                    </svg>
                                    {sortOptions.find(o => o.value === sortBy)?.label}
                                    <svg className={`w-4 h-4 text-[#A1A1AA] transition-transform ${showSortDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {showSortDropdown && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowSortDropdown(false)} />
                                        <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-[#E4E4E7] bg-white shadow-xl z-50 overflow-hidden">
                                            {sortOptions.map((option) => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        setSortBy(option.value)
                                                        setShowSortDropdown(false)
                                                    }}
                                                    className={`w-full text-left px-4 py-2.5 text-sm transition ${sortBy === option.value
                                                        ? "bg-[#CCFBF1] text-[#0F4C5C] font-semibold"
                                                        : "text-[#3F3F46] hover:bg-[#F0FDFA]"
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Create Tour CTA */}
                            <Link
                                href="/planner"
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-[#5FCBC4] text-white text-sm font-semibold hover:bg-[#4AB8B0] transition shadow-lg shadow-[#5FCBC4]/25"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                New Tour
                            </Link>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-24 rounded-2xl border border-[#E4E4E7] bg-white">
                            <div className="w-16 h-16 mx-auto mb-6 border-4 border-[#5FCBC4] border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Loading tours...</h3>
                            <p className="text-[#A1A1AA]">Fetching your curated travel experiences</p>
                        </div>
                    )}

                    {/* Error State */}
                    {!loading && error && (
                        <div className="text-center py-24 rounded-2xl border border-red-200 bg-red-50">
                            <svg className="w-16 h-16 mx-auto mb-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">Error Loading Tours</h3>
                            <p className="text-[#A1A1AA] mb-6">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2.5 rounded-xl bg-[#5FCBC4] text-white font-semibold hover:bg-[#4AB8B0] transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && !error && processedTours.length === 0 && (
                        <div className="text-center py-24 rounded-2xl border border-[#E4E4E7] bg-white">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#CCFBF1] flex items-center justify-center">
                                <svg className="w-10 h-10 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                </svg>
                            </div>
                            {searchQuery ? (
                                <>
                                    <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">No tours match your search</h3>
                                    <p className="text-[#A1A1AA] mb-6">Try adjusting your search query or clear the filter</p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="inline-block px-6 py-2.5 rounded-xl border border-[#E4E4E7] text-[#3F3F46] font-semibold hover:bg-[#CCFBF1] hover:border-[#5FCBC4] transition"
                                    >
                                        Clear Search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-semibold text-[#0F4C5C] mb-2">No tours yet</h3>
                                    <p className="text-[#A1A1AA] mb-6">Start planning your first adventure today!</p>
                                    <Link
                                        href="/planner"
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#5FCBC4] text-white font-semibold hover:bg-[#4AB8B0] transition shadow-lg shadow-[#5FCBC4]/25"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create Your First Tour
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {/* Tours Grid */}
                    {!loading && !error && processedTours.length > 0 && (
                        <>
                            {/* Results count */}
                            <div className="mb-5 flex items-center justify-between">
                                <p className="text-sm text-[#A1A1AA]">
                                    Showing <span className="font-medium text-[#3F3F46]">{processedTours.length}</span> tour{processedTours.length !== 1 ? "s" : ""}
                                    {searchQuery && (
                                        <span> for &ldquo;<span className="text-[#5FCBC4]">{searchQuery}</span>&rdquo;</span>
                                    )}
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {currentTours.map((tour) => (
                                    <div
                                        key={tour.tour_id}
                                        className="group rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden transition-all duration-300 hover:border-[#5FCBC4] hover:shadow-xl hover:shadow-[#5FCBC4]/10 hover:-translate-y-1 cursor-pointer"
                                        onClick={() => router.push(`/tours/${tour.tour_id}/detail`)}
                                    >
                                        {/* Image */}
                                        <div className="relative h-52 overflow-hidden">
                                            <img
                                                src={tour.accommodation?.images?.[0] || getDestinationImage(tour.destination.city)}
                                                alt={tour.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                                            {/* Duration Badge */}
                                            <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-[#0F4C5C] flex items-center gap-1.5 shadow-sm">
                                                <svg className="w-3.5 h-3.5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {tour.duration_days} day{tour.duration_days !== 1 ? "s" : ""}
                                            </div>

                                            {/* Price Badge */}
                                            <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-[#5FCBC4]/90 backdrop-blur-sm text-xs font-bold text-white shadow-sm">
                                                {formatPrice(tour.pricing?.total || 0)}
                                            </div>

                                            {/* Destination overlay */}
                                            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                                                <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="text-sm font-medium text-white/90 drop-shadow-md">
                                                    {tour.destination.city}, {tour.destination.country}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="text-lg font-semibold text-[#0F4C5C] mb-2 line-clamp-1 group-hover:text-[#5FCBC4] transition">
                                                {tour.title}
                                            </h3>
                                            <p className="text-sm text-[#A1A1AA] mb-4 line-clamp-2 leading-relaxed">
                                                {tour.description}
                                            </p>

                                            {/* Tour Details */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {tour.accommodation?.hotel_name && (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F0FDFA] text-xs text-[#0F4C5C] font-medium">
                                                        <svg className="w-3.5 h-3.5 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                        </svg>
                                                        {tour.accommodation.hotel_name.length > 20
                                                            ? tour.accommodation.hotel_name.substring(0, 20) + "…"
                                                            : tour.accommodation.hotel_name}
                                                    </span>
                                                )}
                                                {tour.accommodation?.hotel_rating && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-xs text-amber-700 font-medium">
                                                        <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                        </svg>
                                                        {tour.accommodation.hotel_rating.toFixed(1)}
                                                    </span>
                                                )}
                                                {tour.itinerary && (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-xs text-blue-600 font-medium">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        {tour.itinerary.reduce((sum, day) => sum + (day.activities?.length || 0), 0)} activities
                                                    </span>
                                                )}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-4 border-t border-[#E4E4E7]">
                                                <div className="flex items-center gap-2 text-xs text-[#A1A1AA]">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    {formatDate(tour.created_at)}
                                                </div>

                                                {/* Pricing breakdown mini */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-lg font-bold text-[#5FCBC4]">
                                                        ${tour.pricing?.total || 0}
                                                    </span>
                                                    <span className="text-xs text-[#A1A1AA]">total</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="mt-12 flex flex-col items-center gap-6">
                                    <p className="text-sm text-[#A1A1AA]">
                                        Showing {startIndex + 1}-{Math.min(endIndex, processedTours.length)} of {processedTours.length} tours
                                    </p>

                                    <div className="flex items-center gap-2">
                                        {/* Previous Button */}
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${currentPage === 1
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
                                                        className={`min-w-[42px] h-10 rounded-xl font-medium transition-all ${currentPage === page
                                                            ? "bg-[#5FCBC4] text-white shadow-lg shadow-[#5FCBC4]/25"
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
                                            className={`px-4 py-2.5 rounded-xl font-medium transition-all ${currentPage === totalPages
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
                        <p>© {new Date().getFullYear()} VietJourney. All rights reserved</p>
                        <p className="mt-2">Crafting unforgettable travel experiences.</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

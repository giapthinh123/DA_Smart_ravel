"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"

interface TourHistory {
    id: string
    status: "Completed" | "In Progress" | "Cancelled" | "Saved" | "Pending"
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

    // Fetch tour history from API
    useEffect(() => {
        const fetchTourHistory = async () => {
            try {
                setLoading(true)
                setError("")
                
                // Get token from localStorage
                const token = localStorage.getItem("token") || localStorage.getItem("auth_token")

                if (!token) {
                    router.push("/login")
                    return
                }

                // Build query params - only send status filter to backend, search is done client-side
                const params = new URLSearchParams()
                if (filter && filter !== "All") {
                    params.append("status", filter)
                }
                params.append("limit", "100")
                
                const queryString = params.toString()
                const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/itinerary/history${queryString ? `?${queryString}` : ''}`

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                })

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}))
                    if (response.status === 401) {
                        // Unauthorized - redirect to login
                        localStorage.removeItem("token")
                        localStorage.removeItem("auth_token")
                        router.push("/login")
                        return
                    }
                    throw new Error(errorData.error || `Failed to fetch tour history: ${response.status}`)
                }

                const data = await response.json()
                // Check if data has history array
                if (!data || !Array.isArray(data.history)) {
                    console.warn("Invalid response format:", data)
                    setTourHistory([])
                    return
                }

                // Transform API data to match TourHistory interface
                const transformedHistory: TourHistory[] = data.history.map((item: any) => {
                    // Map status to proper format (backend already sends capitalized status)
                    let status: TourHistory["status"] = "Pending"
                    const itemStatus = (item.status || "").toLowerCase()
                    
                    if (itemStatus.includes("complete")) status = "Completed"
                    else if (itemStatus.includes("progress") || itemStatus === "pending") status = "In Progress"
                    else if (itemStatus.includes("cancel")) status = "Cancelled"
                    else if (itemStatus === "saved") status = "Saved"
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
                return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            case "In Progress":
            case "Pending":
                return "bg-blue-500/20 text-blue-400 border-blue-500/30"
            case "Cancelled":
                return "bg-red-500/20 text-red-400 border-red-500/30"
            case "Saved":
                return "bg-amber-500/20 text-amber-400 border-amber-500/30"
            default:
                return "bg-gray-500/20 text-gray-400 border-gray-500/30"
        }
    }

    // Client-side filtering for search (status filter is handled by backend)
    const filteredTours = tourHistory.filter(tour => {
        if (!searchQuery) return true
        const query = searchQuery.toLowerCase()
        return tour.name.toLowerCase().includes(query) ||
            tour.destination.toLowerCase().includes(query)
    })

    const filterOptions = ["All", "Completed", "In Progress", "Saved", "Cancelled"]
    const stats = {
        total: tourHistory.length,
        completed: tourHistory.filter(t => t.status === "Completed").length,
        inProgress: tourHistory.filter(t => t.status === "In Progress" || t.status === "Pending").length,
        saved: tourHistory.filter(t => t.status === "Saved").length,
    }

    return (
        <AuthGuard>
            <div className="relative min-h-screen bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7]">
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
                                Your Travel Timeline
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
                            <span className="mx-2 h-4 w-px bg-white/20"></span>
                            <UserMenu />
                        </nav>
                    </div>
                </header>

                {/* Main Content */}
                <main className="mx-auto max-w-7xl px-6 pb-16">
                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-white mb-3 drop-shadow-[0_12px_24px_rgba(255,229,180,0.4)]">
                            Tour History
                        </h1>
                        <p className="text-[#A5ABA3] text-lg">
                            Explore your past adventures and planned journeys
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6 transition hover:bg-white/8">
                            <div className="text-3xl font-bold text-[#FFE5B4] mb-2">{stats.total}</div>
                            <div className="text-sm text-[#A5ABA3]">Total Tours</div>
                        </div>
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 backdrop-blur p-6 transition hover:bg-emerald-500/15">
                            <div className="text-3xl font-bold text-emerald-400 mb-2">{stats.completed}</div>
                            <div className="text-sm text-emerald-300">Completed</div>
                        </div>
                        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 backdrop-blur p-6 transition hover:bg-blue-500/15">
                            <div className="text-3xl font-bold text-blue-400 mb-2">{stats.inProgress}</div>
                            <div className="text-sm text-blue-300">In Progress</div>
                        </div>
                        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 backdrop-blur p-6 transition hover:bg-amber-500/15">
                            <div className="text-3xl font-bold text-amber-400 mb-2">{stats.saved}</div>
                            <div className="text-sm text-amber-300">Saved</div>
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
                                            ? "bg-[#FFE5B4] text-[#2B1200] shadow-[0_4px_16px_rgba(255,229,180,0.4)]"
                                            : "bg-white/10 text-[#F3F0E9] hover:bg-white/15"
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-80">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#A5ABA3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search tours or destinations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/20 bg-[#0D1820]/80 text-white placeholder:text-[#A5ABA3] focus:outline-none focus:border-[#FFE5B4] focus:ring-2 focus:ring-[#FFE5B4]/20 transition"
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                            <div className="w-16 h-16 mx-auto mb-4 border-4 border-[#FFE5B4] border-t-transparent rounded-full animate-spin"></div>
                            <h3 className="text-xl font-semibold text-white mb-2">Loading your tours...</h3>
                            <p className="text-[#A5ABA3]">Please wait a moment</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="text-center py-20 rounded-2xl border border-red-500/20 bg-red-500/10 backdrop-blur">
                            <svg className="w-16 h-16 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">Error Loading Tours</h3>
                            <p className="text-[#A5ABA3] mb-4">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 rounded-lg bg-[#FFE5B4] text-[#2B1200] font-semibold hover:bg-[#FFD79E] transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {/* Tours Grid */}
                    {!loading && !error && filteredTours.length === 0 && (
                        <div className="text-center py-20 rounded-2xl border border-white/10 bg-white/5 backdrop-blur">
                            <svg className="w-16 h-16 mx-auto mb-4 text-[#7D837A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-xl font-semibold text-white mb-2">No tours found</h3>
                            <p className="text-[#A5ABA3] mb-4">Try adjusting your filters or search query</p>
                            <Link
                                href="/dashboard"
                                className="inline-block px-6 py-2 rounded-lg bg-[#FFE5B4] text-[#2B1200] font-semibold hover:bg-[#FFD79E] transition"
                            >
                                Create New Tour
                            </Link>
                        </div>
                    )}

                    {!loading && !error && filteredTours.length > 0 && (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTours.map((tour) => (
                                <div
                                    key={tour.id}
                                    className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur overflow-hidden transition-all hover:border-[#FFE5B4]/40 hover:shadow-[0_8px_32px_rgba(255,229,180,0.2)] cursor-pointer"
                                    onClick={() => router.push(`/full_tour?itineraryId=${tour.id}`)}
                                >
                                    {/* Image */}
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={tour.image}
                                            alt={tour.name}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                                        {/* Status Badge */}
                                        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur ${getStatusColor(tour.status)}`}>
                                            {tour.status}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-[#FFE5B4] transition">
                                            {tour.name}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm text-[#A5ABA3]">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                {tour.destination}
                                            </div>
                                            <div className="flex items-center text-sm text-[#A5ABA3]">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                {tour.dates}
                                            </div>
                                            <div className="flex items-center text-sm text-[#A5ABA3]">
                                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                                {tour.travelers}
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                            <div className="flex items-center gap-4">
                                                <span className="text-lg font-bold text-[#FFE5B4]">{tour.budget}</span>
                                                <span className="text-xs text-[#7D837A]">·</span>
                                                <span className="text-sm text-[#A5ABA3]">{tour.activities} activities</span>
                                            </div>
                                            {tour.rating && (
                                                <div className="flex items-center gap-1">
                                                    <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                    <span className="text-sm font-semibold text-amber-400">{tour.rating}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="mt-8 border-t border-white/10 bg-[#061017]/80 py-10 backdrop-blur">
                    <div className="mx-auto max-w-7xl px-6 text-center text-sm text-[#7D837A]">
                        <p>© 2025 VietJourney. All rights reserved</p>
                        <p className="mt-2">Preserving your travel memories.</p>
                    </div>
                </footer>
            </div>
        </AuthGuard>
    )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { data_build_tour, data_flight, data_flight_search } from "@/types/domain"
import { AuthGuard } from "@/components/auth-guard"
import { AdminOnly } from "@/components/role-gate"
import { useAuthStore } from "@/store/useAuthStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import api from "@/lib/axios"
const outboundFlights = [
  {
    id: 1,
    airline: "Vietnam Airlines",
    departureTime: "06:00 AM",
    arrivalTime: "08:15 AM",
    duration: "2h 15m",
    price: 1250000,
    class: "Phổ thông",
    isDirect: true,
  },
  {
    id: 2,
    airline: "Vietjet Air",
    departureTime: "09:30 AM",
    arrivalTime: "11:45 AM",
    duration: "2h 15m",
    price: 850000,
    class: "Phổ thông",
    isDirect: false,
    stopover: "Đà Nẵng (1h 30m)",
  },
  {
    id: 3,
    airline: "Bamboo Airways",
    departureTime: "01:15 PM",
    arrivalTime: "03:30 PM",
    duration: "2h 15m",
    price: 1100000,
    class: "Thương gia",
    isDirect: true,
  },
]

const returnFlights = [
  {
    id: 101,
    airline: "Vietnam Airlines",
    departureTime: "02:00 PM",
    arrivalTime: "04:15 PM",
    duration: "2h 15m",
    price: 1350000,
    class: "Phổ thông",
    isDirect: true,
  },
  {
    id: 102,
    airline: "Bamboo Airways",
    departureTime: "05:30 PM",
    arrivalTime: "07:45 PM",
    duration: "2h 15m",
    price: 1050000,
    class: "Phổ thông",
    isDirect: true,
  },
  {
    id: 103,
    airline: "Vietjet Air",
    departureTime: "09:00 PM",
    arrivalTime: "11:15 PM",
    duration: "2h 15m",
    price: 750000,
    class: "Phổ thông",
    isDirect: false,
    stopover: "Hải Phòng (1h)",
  },
]

function FlightsContent() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedOutbound, setSelectedOutbound] = useState<any>(null)
  const [selectedReturn, setSelectedReturn] = useState<any>(null)
  const [dataBuildTour, setDataBuildTour] = useState<data_build_tour | null>(null)
  const [flightDeparture, setFlightDeparture] = useState<any>(null)
  const [flightReturn, setFlightReturn] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Lazy loading states
  const [displayCount, setDisplayCount] = useState(10)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const ITEMS_PER_PAGE = 10

  // Sort states
  type SortOption = 'default' | 'lowest' | 'highest'
  const [timeSort, setTimeSort] = useState<SortOption>('default')
  const [priceSort, setPriceSort] = useState<SortOption>('default')

  // Map data từ API sang format UI
  const mapFlightToUI = (flight: any, index: number) => {
    // Parse time strings
    const depTime = new Date(flight.dep_time)
    const arrTime = new Date(flight.arr_time)

    // Calculate duration
    const durationMs = arrTime.getTime() - depTime.getTime()
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    const duration = `${hours}h ${minutes}m`

    // Format times
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
    }

    const stopsCount = flight.stops?.length || 0
    let stopoverText = ''
    if (stopsCount > 0) {
      // Lấy IATA code từ stop đầu tiên
      const firstStop = flight.stops[0]
      stopoverText = firstStop.iata ? `${firstStop.iata}` : firstStop.name
    }

    return {
      id: index + 1,
      airline: flight.airline,
      departureTime: formatTime(depTime),
      arrivalTime: formatTime(arrTime),
      duration: duration,
      price: parseFloat(flight.price) * 25000, // Convert EUR to VND (approximate)
      class: "Phổ thông",
      isDirect: stopsCount === 0,
      stops: stopsCount,
      stopover: stopoverText,
      airlineCode: flight.flight_code?.substring(0, 2) || '',
      departureCode: flight.dep_iata,
      arrivalCode: flight.arr_iata
    }
  }

  // Flatten grouped flight data from API
  const flattenFlights = (data: any): any[] => {
    if (!data || typeof data !== 'object') return []

    const allFlights: any[] = []
    Object.keys(data).forEach(airline => {
      if (Array.isArray(data[airline])) {
        allFlights.push(...data[airline])
      }
    })
    return allFlights
  }

  // Get all flights for current step
  const baseFlights = step === 1
    ? (flightDeparture && Object.keys(flightDeparture).length > 0)
      ? flattenFlights(flightDeparture).map(mapFlightToUI)
      : outboundFlights
    : (flightReturn && Object.keys(flightReturn).length > 0)
      ? flattenFlights(flightReturn).map(mapFlightToUI)
      : returnFlights

  // Apply sorting
  const allCurrentFlights = [...baseFlights].sort((a, b) => {
    // Sort by time
    if (timeSort === 'lowest') {
      const timeA = a.departureTime.replace(':', '')
      const timeB = b.departureTime.replace(':', '')
      return timeA.localeCompare(timeB)
    } else if (timeSort === 'highest') {
      const timeA = a.departureTime.replace(':', '')
      const timeB = b.departureTime.replace(':', '')
      return timeB.localeCompare(timeA)
    }

    // Sort by price
    if (priceSort === 'lowest') {
      return a.price - b.price
    } else if (priceSort === 'highest') {
      return b.price - a.price
    }

    // Default order
    return 0
  })

  // Slice flights for lazy loading
  const currentFlights = allCurrentFlights.slice(0, displayCount)
  const hasMore = displayCount < allCurrentFlights.length

  const selectedCurrentId = step === 1 ? selectedOutbound?.id : selectedReturn?.id

  // Reset display count and sort options when step changes
  useEffect(() => {
    setDisplayCount(ITEMS_PER_PAGE)
    setTimeSort('default')
    setPriceSort('default')
  }, [step])

  // Load more flights
  const loadMore = () => {
    if (isLoadingMore) return
    setIsLoadingMore(true)

    // Simulate loading delay for better UX
    setTimeout(() => {
      setDisplayCount(prev => prev + ITEMS_PER_PAGE)
      setIsLoadingMore(false)
    }, 300)
  }

  // Auto load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near bottom (within 500px)
      const scrollPosition = window.innerHeight + window.scrollY
      const bottomPosition = document.documentElement.scrollHeight - 500

      if (scrollPosition >= bottomPosition && hasMore && !isLoading && !isLoadingMore) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMore, isLoading, isLoadingMore, displayCount])

  // Đọc dữ liệu từ sessionStorage khi component mount
  useEffect(() => {
    const storedData = sessionStorage.getItem('flightSearchData')
    if (storedData) {
      const parsedData = JSON.parse(storedData) as data_build_tour
      setDataBuildTour(parsedData)
    }
  }, [])

  // Gọi API lấy danh sách chuyến bay
  useEffect(() => {
    const fetchFlights = async () => {
      if (dataBuildTour && dataBuildTour.flight_departure_date && dataBuildTour.flight_return_date) {
        setIsLoading(true)
        setError(null)
        try {
          // Gọi API cho chuyến đi
          const responseDeparture = await api.post<{ success: boolean; data: any }>("/api/flights/", {
            departure_city: dataBuildTour.departure,
            arrival_city: dataBuildTour.destination,
            departure_date: dataBuildTour.flight_departure_date
          })

          if (responseDeparture.data.success && responseDeparture.data.data) {
            console.log("Chuyến đi:", responseDeparture.data.data)
            setFlightDeparture(responseDeparture.data.data)
          }

          // Gọi API cho chuyến về
          const responseReturn = await api.post<{ success: boolean; data: any }>("/api/flights/", {
            departure_city: dataBuildTour.destination,
            arrival_city: dataBuildTour.departure,
            departure_date: dataBuildTour.flight_return_date
          })

          if (responseReturn.data.success && responseReturn.data.data) {
            console.log("Chuyến về:", responseReturn.data.data)
            setFlightReturn(responseReturn.data.data)
          }
        } catch (error: any) {
          console.error("Lỗi khi lấy dữ liệu chuyến bay:", error)
          if (error.code === 'ECONNABORTED') {
            setError("Hết thời gian chờ. Vui lòng thử lại sau.")
          } else if (error.response?.status === 500) {
            setError("Lỗi server. Vui lòng thử lại sau.")
          } else {
            setError("Không thể tải dữ liệu chuyến bay. Vui lòng thử lại.")
          }
        } finally {
          setIsLoading(false)
        }
      }
    }
    fetchFlights()
  }, [dataBuildTour])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN").format(price)
  }

  // Format date for booking summary
  const formatBookingDate = (dateString: string | null) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const handleSelect = (flight: (typeof outboundFlights)[0]) => {
    if (step === 1) {
      setSelectedOutbound(flight)
      setStep(2)
    } else {
      setSelectedReturn(flight)
    }
  }

  const totalPrice = (selectedOutbound?.price || 0) + (selectedReturn?.price || 0)
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7]">
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 229, 180, 0.3);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 229, 180, 0.5);
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

      <main className="mx-auto max-w-[1600px] px-6 ">
        {/* Page Title Section */}
        <section className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[#7D837A]">
            Flight Booking
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
            Đặt Vé Máy Bay
          </h1>
          <p className="text-base text-[#A5ABA3] max-w-2xl mx-auto leading-relaxed mb-8">
            Tìm kiếm và đặt vé máy bay với giá tốt nhất cho chuyến đi của bạn
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              onClick={() => setStep(1)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl cursor-pointer transition-all border backdrop-blur ${step === 1
                  ? "bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-[#2B1200] border-[#FFE5B4] shadow-lg shadow-[#FFE5B4]/30"
                  : "bg-white/5 text-[#D0D7D8] border-white/10 hover:bg-white/10 hover:border-[#FFE5B4]/40"
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === 1 ? "bg-white text-[#2B1200] border-[#FFB56D]" : "bg-white/10 text-[#FFE5B4] border-[#FFE5B4]/50"
                  }`}
              >
                1
              </div>
              <span className="font-bold">Chiều đi: {dataBuildTour?.departure} → {dataBuildTour?.destination}</span>
              {selectedOutbound && <CheckCircle2 className={`w-4 h-4 ${step === 1 ? "text-emerald-600" : "text-emerald-400"}`} />}
            </div>
            <ArrowRight className="text-[#7D837A]" />
            <div
              onClick={() => selectedOutbound && setStep(2)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border backdrop-blur ${!selectedOutbound ? "opacity-50 cursor-not-allowed bg-white/5 text-[#7D837A] border-white/10" : "cursor-pointer"
                } ${step === 2 ? "bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-[#2B1200] border-[#FFE5B4] shadow-lg shadow-[#FFE5B4]/30" : "bg-white/5 text-[#D0D7D8] border-white/10 hover:bg-white/10 hover:border-[#FFE5B4]/40"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === 2 ? "bg-white text-[#2B1200] border-[#FFB56D]" : "bg-white/10 text-[#FFE5B4] border-[#FFE5B4]/50"
                  }`}
              >
                2
              </div>
              <span className="font-bold">Chiều về: {dataBuildTour?.destination} → {dataBuildTour?.departure}</span>
              {selectedReturn && <CheckCircle2 className={`w-4 h-4 ${step === 2 ? "text-emerald-600" : "text-emerald-400"}`} />}
            </div>
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left Column - Flight List */}
          <div className="flex-1 w-full space-y-8 pb-32">
            {/* Sort Controls */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              {/* Time Sort */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-sm text-[#A5ABA3] font-medium whitespace-nowrap">Thời gian:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setTimeSort('default')
                      setPriceSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeSort === 'default'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Mặc định
                  </button>
                  <button
                    onClick={() => {
                      setTimeSort('lowest')
                      setPriceSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeSort === 'lowest'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Sớm nhất
                  </button>
                  <button
                    onClick={() => {
                      setTimeSort('highest')
                      setPriceSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeSort === 'highest'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Muộn nhất
                  </button>
                </div>
              </div>

              {/* Price Sort */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-sm text-[#A5ABA3] font-medium whitespace-nowrap">Giá:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setPriceSort('default')
                      setTimeSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priceSort === 'default'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Mặc định
                  </button>
                  <button
                    onClick={() => {
                      setPriceSort('lowest')
                      setTimeSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priceSort === 'lowest'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Thấp nhất
                  </button>
                  <button
                    onClick={() => {
                      setPriceSort('highest')
                      setTimeSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priceSort === 'highest'
                        ? 'bg-[#FFE5B4] text-[#2B1200] shadow-lg'
                        : 'bg-white/5 text-[#D0D7D8] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Cao nhất
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Flight List Container */}
            <div
              className="max-h-[calc(100vh)] overflow-y-auto pr-2 custom-scrollbar"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 229, 180, 0.3) rgba(255, 255, 255, 0.05)'
              }}
            >
              {error ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <p className="text-red-400 text-lg font-semibold">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#FFE5B4]"></div>
                  <p className="text-[#A5ABA3] text-lg">Đang tìm kiếm chuyến bay tốt nhất cho bạn...</p>
                  <p className="text-[#7D837A] text-sm">Vui lòng đợi, quá trình này có thể mất 20-30 giây</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentFlights.map((flight) => (
                    <Card
                      key={flight.id}
                      className={`overflow-hidden transition-all duration-300 border backdrop-blur ${selectedCurrentId === flight.id
                          ? "border-[#FFE5B4] bg-white/10 shadow-[0_20px_60px_-20px_rgba(255,229,180,0.4)]"
                          : "border-white/10 bg-white/5 hover:border-[#FFE5B4]/50 hover:bg-white/8"
                        }`}
                    >
                      <CardContent className="p-0">
                        <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                          {/* Airline Info */}
                          <div className="flex flex-col w-full md:w-40">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-[#FFE5B4]" />
                              <span className="font-semibold text-sm text-white">{flight.airline}</span>
                            </div>
                            <div className="text-xs text-[#A5ABA3] mt-1">{flight.class}</div>
                          </div>

                          {/* Flight Times */}
                          <div className="flex-1 flex items-center justify-between gap-6 w-full">
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{flight.departureTime}</div>
                              <div className="text-xs font-semibold text-[#A5ABA3] uppercase tracking-wider">
                                {(flight as any).departureCode || (step === 1 ? dataBuildTour?.departure : dataBuildTour?.destination)}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center gap-2">
                              <div className="text-xs text-[#A5ABA3] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {flight.duration}
                              </div>
                              <div className="relative w-full h-px bg-white/20 flex items-center justify-center">
                                <div className="absolute h-1.5 w-1.5 rounded-full bg-white/30 -left-0.5" />
                                <div className="absolute h-1.5 w-1.5 rounded-full bg-white/30 -right-0.5" />
                                <div className="bg-[#0D1820] px-1">
                                  <Plane className="w-4 h-4 text-[#FFE5B4] rotate-90" />
                                </div>
                              </div>
                              {flight.isDirect ? (
                                <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded">
                                  Bay thẳng
                                </div>
                              ) : (
                                <div className="flex flex-col items-center">
                                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-tight bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded">
                                    {(flight as any).stops} Điểm dừng
                                  </div>
                                  {(flight as any).stopover && (
                                    <div className="text-[9px] text-[#A5ABA3] mt-0.5">{(flight as any).stopover}</div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{flight.arrivalTime}</div>
                              <div className="text-xs font-semibold text-[#A5ABA3] uppercase tracking-wider">
                                {(flight as any).arrivalCode || (step === 1 ? dataBuildTour?.destination : dataBuildTour?.departure)}
                              </div>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-8">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#FFE5B4]">{formatPrice(flight.price)}đ</div>
                              <div className="text-[10px] text-[#A5ABA3] uppercase tracking-tighter">
                                Giá đã bao gồm thuế
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSelect(flight)}
                              className={`rounded-xl px-8 h-12 font-semibold transition-all border ${selectedCurrentId === flight.id
                                  ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 scale-105 shadow-lg shadow-emerald-500/30"
                                  : "bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] hover:shadow-lg hover:shadow-[#FFB56D]/30 text-[#2B1200] border-[#FFE5B4]"
                                }`}
                            >
                              {selectedCurrentId === flight.id ? (
                                <span className="flex items-center gap-2">
                                  <ShieldCheck className="w-4 h-4" /> Đã chọn
                                </span>
                              ) : (
                                "Chọn vé"
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Loading more indicator */}
                  {isLoadingMore && (
                    <div className="flex justify-center mt-8 py-4">
                      <div className="flex items-center gap-3 text-[#A5ABA3]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFE5B4]"></div>
                        <span>Đang tải thêm...</span>
                      </div>
                    </div>
                  )}

                  {/* Load More Button - Only show if not auto-loading */}
                  {!isLoading && !error && hasMore && !isLoadingMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMore}
                        className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-[#FFE5B4]/50 text-white font-semibold transition-all flex items-center gap-2 group"
                      >
                        <span>Xem thêm {Math.min(ITEMS_PER_PAGE, allCurrentFlights.length - displayCount)} chuyến bay</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-90" />
                      </button>
                    </div>
                  )}

                  {/* Showing count */}
                  {!isLoading && !error && (
                    <div className="text-center mt-6 text-sm text-[#7D837A]">
                      Đang hiển thị {currentFlights.length} / {allCurrentFlights.length} chuyến bay
                      {allCurrentFlights.length === currentFlights.length && allCurrentFlights.length > ITEMS_PER_PAGE && (
                        <span className="ml-2 text-[#FFE5B4]">• Đã hiển thị tất cả</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* End Scrollable Container */}
          </div>
          <div className="w-full lg:w-[420px] shrink-0">
            <div className="lg:sticky lg:top-8 bg-gradient-to-br from-[#1A2F3A] to-[#0D1820] rounded-3xl shadow-2xl border border-white/10 animate-in slide-in-from-right duration-500">
              {/* Header */}
              <div className="px-8 pt-8 pb-6 border-b border-white/10">
                <h2 className="text-2xl font-bold text-white">Booking Summary</h2>
              </div>

              {/* Content */}
              <div className="px-8 py-6 space-y-6">
                {/* Selected Flights */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#7D837A] font-bold mb-4">Selected Flights</h3>

                  {/* Departure */}
                  {selectedOutbound ? (
                    <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#A5ABA3]">Departure • {formatBookingDate(dataBuildTour?.flight_departure_date || null)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white uppercase">{selectedOutbound.airline}</span>
                        <span className="text-sm font-bold text-[#FFE5B4]">{selectedOutbound.departureTime}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                      <div className="text-center py-4">
                        <p className="text-sm text-[#7D837A]">No departure flight selected</p>
                      </div>
                    </div>
                  )}

                  {/* Return */}
                  {selectedReturn ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#A5ABA3]">Return • {formatBookingDate(dataBuildTour?.flight_return_date || null)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white uppercase">{selectedReturn.airline}</span>
                        <span className="text-sm font-bold text-[#FFE5B4]">{selectedReturn.departureTime}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                      <div className="text-center py-4">
                        <p className="text-sm text-[#7D837A]">No return flight selected</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Details */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#7D837A] font-bold mb-4">Price Details</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#D0D7D8]">Departure flight</span>
                      <span className="text-white font-semibold">
                        {selectedOutbound ? `${formatPrice(selectedOutbound.price)}đ` : '-'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#D0D7D8]">Return flight</span>
                      <span className="text-white font-semibold">
                        {selectedReturn ? `${formatPrice(selectedReturn.price)}đ` : '-'}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#FFE5B4]/10 to-[#FFB56D]/10 border border-[#FFE5B4]/20">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-[#FFE5B4]">{formatPrice(totalPrice)}đ</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8">
                <button
                  onClick={() => {
                    // Handle booking confirmation
                    console.log("Booking confirmed", { selectedOutbound, selectedReturn })
                  }}
                  disabled={!selectedOutbound || !selectedReturn}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selectedOutbound && selectedReturn
                      ? 'bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] hover:shadow-xl hover:shadow-[#FFB56D]/40 text-[#2B1200] hover:scale-[1.02] cursor-pointer'
                      : 'bg-white/10 text-[#7D837A] cursor-not-allowed opacity-50'
                    }`}
                >
                  Confirm Booking
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* End Two Column Layout */}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#061017]/80 py-10 backdrop-blur">
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

export default function FlightsPage() {
  return (
    <AuthGuard>
      <FlightsContent />
    </AuthGuard>
  )
}

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from '@/components/ui/button'
import { Card, CardContent } from "@/components/ui/card"
import { Plane, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react"
import { data_build_tour, data_flight, data_flight_search, SelectedFlightForItinerary, FlightsSelectionPayload } from "@/types/domain"
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
import { TravelService } from "@/services/travel.service"
import { UserMenu } from "@/components/user-menu"
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

    // Preserve stops for itinerary payload (quá cảnh): iata, name, arrival, departure
    const stopsForItinerary = (flight.stops && Array.isArray(flight.stops))
      ? flight.stops.map((s: { iata?: string; name?: string; arrival?: string; departure?: string }) => ({
        iata: s.iata ?? '',
        name: s.name ?? '',
        arrival: s.arrival ?? '',
        departure: s.departure ?? '',
      }))
      : []

    return {
      id: index + 1,
      airline: flight.airline,
      departureTime: formatTime(depTime),
      arrivalTime: formatTime(arrTime),
      duration: duration,
      price: parseFloat(flight.price), // Convert EUR to VND (approximate)
      class: "Phổ thông",
      isDirect: stopsCount === 0,
      stops: stopsCount,
      stopover: stopoverText,
      airlineCode: flight.flight_code?.substring(0, 2) || '',
      departureCode: flight.dep_iata,
      arrivalCode: flight.arr_iata,
      stopsForItinerary,
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
      : []
    : (flightReturn && Object.keys(flightReturn).length > 0)
      ? flattenFlights(flightReturn).map(mapFlightToUI)
      : []

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
      if (!dataBuildTour?.flight_departure_date || !dataBuildTour?.flight_return_date) return
      const depCity = String(dataBuildTour.departure ?? '').trim()
      const arrCity = String(dataBuildTour.destination ?? '').trim()
      const depDate = String(dataBuildTour.flight_departure_date).trim()
      const retDate = String(dataBuildTour.flight_return_date).trim()

      if (!depCity || !arrCity || !depDate || !retDate) {
        setError('Thiếu thông tin điểm đi, điểm đến hoặc ngày bay.')
        return
      }

      // Chuẩn hóa ngày về YYYY-MM-DD (backend chỉ nhận format này)
      const toYYYYMMDD = (s: string) => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
        const d = new Date(s)
        if (Number.isNaN(d.getTime())) return s
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        return `${y}-${m}-${day}`
      }
      const departure_date = toYYYYMMDD(depDate)
      const return_date = toYYYYMMDD(retDate)
      console.log("departure_date", departure_date)
      console.log("return_date", return_date)
      console.log("depCity", depCity)
      console.log("arrCity", arrCity)
      setIsLoading(true)
      setError(null)
      try {
        const responseDeparture = await TravelService.searchFlights({
          departure_city: depCity,
          arrival_city: arrCity,
          departure_date,
        })
        setFlightDeparture(responseDeparture)

        const responseReturn = await TravelService.searchFlights({
          departure_city: arrCity,
          arrival_city: depCity,
          departure_date: return_date,
        })
        setFlightReturn(responseReturn)
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

  const handleSelect = (flight: any) => {
    if (step === 1) {
      setSelectedOutbound(flight)
      setStep(2)
    } else {
      setSelectedReturn(flight)
    }
  }

  /** Map flight card object to itinerary payload (selectedDepartureFlight / selectedReturnFlight) */
  const mapFlightToItineraryPayload = (flight: any): SelectedFlightForItinerary => {

    const base = {
      airline: flight.airline ?? "",
      airlineCode: flight.airlineCode ?? "",
      departTime: flight.departureTime ?? "",
      arriveTime: flight.arrivalTime ?? "",
      departCode: flight.departureCode ?? "",
      arriveCode: flight.arrivalCode ?? "",
      duration: flight.duration ?? "",
      price: flight.price ?? 0,
      stop_count: flight.stops ?? 0,
    }
    if (flight.stopsForItinerary?.length) {
      return { ...base, stops: flight.stopsForItinerary }
    }
    return base
  }

  /** Calculate days from dataBuildTour dates (dd/mm/yyyy or YYYY-MM-DD) */
  const calculateDaysFromBuildTour = (): number => {
    if (!dataBuildTour?.departureDate || !dataBuildTour?.returnDate) return 0
    const parseDate = (s: string): Date | null => {
      if (!s) return null
      if (s.includes("/")) {
        const [d, m, y] = s.split("/").map(Number)
        return new Date(y, m - 1, d)
      }
      const d = new Date(s)
      return isNaN(d.getTime()) ? null : d
    }
    const start = parseDate(dataBuildTour.departureDate)
    const end = parseDate(dataBuildTour.returnDate)
    if (!start || !end) return 0
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  const handleConfirmBooking = () => {
    if (!selectedOutbound || !selectedReturn || !dataBuildTour) return
    const days = dataBuildTour.days && dataBuildTour.days > 0 ? dataBuildTour.days : calculateDaysFromBuildTour()
    const flightsPayload: FlightsSelectionPayload = {
      selectedDepartureFlight: mapFlightToItineraryPayload(selectedOutbound),
      selectedReturnFlight: mapFlightToItineraryPayload(selectedReturn),
    }
    // Đảm bảo departureDate/returnDate có giá trị (fallback từ ngày bay nếu còn trống)
    const departureDate = (dataBuildTour.departureDate && dataBuildTour.departureDate.trim() !== "")
      ? dataBuildTour.departureDate
      : (dataBuildTour.flight_departure_date ?? "")
    const returnDate = (dataBuildTour.returnDate && dataBuildTour.returnDate.trim() !== "")
      ? dataBuildTour.returnDate
      : (dataBuildTour.flight_return_date ?? "")
    const currentTripData = {
      ...dataBuildTour,
      departureDate,
      returnDate,
      days,
      book_flight: true,
      flights: flightsPayload,
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("currentTripData", JSON.stringify(currentTripData))
    }
    router.push(`/preferences?cityId=${dataBuildTour.destination_city_id}`)
  }

  const totalPrice = (selectedOutbound?.price || 0) + (selectedReturn?.price || 0)
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B]">
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
            background: rgba(95, 203, 196, 0.3);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(95, 203, 196, 0.5);
          }
        `
      }} />
      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#F5F5F5] via-[#F5F5F5]/40 to-transparent" />
      </div>

      {/* Header */}
      <header className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#94A3B8]">
              VietJourney
            </p>
            <p className="text-xl font-semibold text-[#0F172A]">
              Mapping Vietnam experiences
            </p>
          </div>
          <nav className="flex items-center gap-2 text-sm font-medium">
            <Link href="/" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
              Home
            </Link>
            <Link href="/planner" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
              Dashboard
            </Link>
            <Link href="/tours" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
              Personalities
            </Link>
            <Link href="#" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
              Contact
            </Link>
            <span className="mx-2 h-4 w-px bg-white/20"></span>

            {/* User Menu Dropdown */}
            <UserMenu />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-6 ">
        {/* Page Title Section */}
        <section className="mb-12 text-center">
          <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[#94A3B8]">
            Flight Booking
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold mb-4 text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
            Đặt Vé Máy Bay
          </h1>
          <p className="text-base text-[#64748B] max-w-2xl mx-auto leading-relaxed mb-8">
            Tìm kiếm và đặt vé máy bay với giá tốt nhất cho chuyến đi của bạn
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <div
              onClick={() => setStep(1)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl cursor-pointer transition-all border backdrop-blur ${step === 1
                ? "bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] text-[#FFFFFF] border-[#5FCBC4] shadow-lg shadow-[#5FCBC4]/30"
                : "bg-white/5 text-[#475569] border-white/10 hover:bg-white/10 hover:border-[#5FCBC4]/40"
                }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === 1 ? "bg-white text-[#FFFFFF] border-[#4AB8B0]" : "bg-white/10 text-[#5FCBC4] border-[#5FCBC4]/50"
                  }`}
              >
                1
              </div>
              <span className="font-bold">Chiều đi: {dataBuildTour?.departure} → {dataBuildTour?.destination}</span>
              {selectedOutbound && <CheckCircle2 className={`w-4 h-4 ${step === 1 ? "text-emerald-600" : "text-emerald-400"}`} />}
            </div>
            <ArrowRight className="text-[#94A3B8]" />
            <div
              onClick={() => selectedOutbound && setStep(2)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all border backdrop-blur ${!selectedOutbound ? "opacity-50 cursor-not-allowed bg-white/5 text-[#94A3B8] border-white/10" : "cursor-pointer"
                } ${step === 2 ? "bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] text-[#FFFFFF] border-[#5FCBC4] shadow-lg shadow-[#5FCBC4]/30" : "bg-white/5 text-[#475569] border-white/10 hover:bg-white/10 hover:border-[#5FCBC4]/40"}`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${step === 2 ? "bg-white text-[#FFFFFF] border-[#4AB8B0]" : "bg-white/10 text-[#5FCBC4] border-[#5FCBC4]/50"
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
                <span className="text-sm text-[#64748B] font-medium whitespace-nowrap">Thời gian:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setTimeSort('default')
                      setPriceSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${timeSort === 'default'
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
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
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
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
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
                      }`}
                  >
                    Muộn nhất
                  </button>
                </div>
              </div>

              {/* Price Sort */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full lg:w-auto">
                <span className="text-sm text-[#64748B] font-medium whitespace-nowrap">Giá:</span>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setPriceSort('default')
                      setTimeSort('default')
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${priceSort === 'default'
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
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
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
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
                      ? 'bg-[#5FCBC4] text-[#FFFFFF] shadow-lg'
                      : 'bg-white/5 text-[#475569] hover:bg-white/10 border border-white/10'
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
                scrollbarColor: 'rgba(95, 203, 196, 0.3) rgba(255, 255, 255, 0.05)'
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
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#5FCBC4]"></div>
                  <p className="text-[#64748B] text-lg">Đang tìm kiếm chuyến bay tốt nhất cho bạn...</p>
                  <p className="text-[#94A3B8] text-sm">Vui lòng đợi, quá trình này có thể mất 20-30 giây</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {currentFlights.map((flight) => (
                    <Card
                      key={flight.id}
                      className={`overflow-hidden transition-all duration-300 border backdrop-blur ${selectedCurrentId === flight.id
                        ? "border-[#5FCBC4] bg-white/10 shadow-[0_20px_60px_-20px_rgba(255,229,180,0.4)]"
                        : "border-white/10 bg-white/5 hover:border-[#5FCBC4]/50 hover:bg-white/8"
                        }`}
                    >
                      <CardContent className="p-0">
                        <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                          {/* Airline Info */}
                          <div className="flex flex-col w-full md:w-40">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-[#5FCBC4]" />
                              <span className="font-semibold text-sm text-white">{flight.airline}</span>
                            </div>
                            <div className="text-xs text-[#64748B] mt-1">{flight.class}</div>
                          </div>

                          {/* Flight Times */}
                          <div className="flex-1 flex items-center justify-between gap-6 w-full">
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{flight.departureTime}</div>
                              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                                {(flight as any).departureCode || (step === 1 ? dataBuildTour?.departure : dataBuildTour?.destination)}
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center gap-2">
                              <div className="text-xs text-[#64748B] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {flight.duration}
                              </div>
                              <div className="relative w-full h-px bg-white/20 flex items-center justify-center">
                                <div className="absolute h-1.5 w-1.5 rounded-full bg-white/30 -left-0.5" />
                                <div className="absolute h-1.5 w-1.5 rounded-full bg-white/30 -right-0.5" />
                                <div className="bg-[#0D1820] px-1">
                                  <Plane className="w-4 h-4 text-[#5FCBC4] rotate-90" />
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
                                    <div className="text-[9px] text-[#64748B] mt-0.5">{(flight as any).stopover}</div>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{flight.arrivalTime}</div>
                              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                                {(flight as any).arrivalCode || (step === 1 ? dataBuildTour?.destination : dataBuildTour?.departure)}
                              </div>
                            </div>
                          </div>

                          {/* Price & Action */}
                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 w-full md:w-48 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-white/10 md:pl-8">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#5FCBC4]">{flight.price}$</div>
                              <div className="text-[10px] text-[#64748B] uppercase tracking-tighter">
                                Giá đã bao gồm thuế
                              </div>
                            </div>
                            <Button
                              onClick={() => handleSelect(flight)}
                              className={`rounded-xl px-8 h-12 font-semibold transition-all border ${selectedCurrentId === flight.id
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 scale-105 shadow-lg shadow-emerald-500/30"
                                : "bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] hover:shadow-lg hover:shadow-[#4AB8B0]/30 text-[#FFFFFF] border-[#5FCBC4]"
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
                      <div className="flex items-center gap-3 text-[#64748B]">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5FCBC4]"></div>
                        <span>Đang tải thêm...</span>
                      </div>
                    </div>
                  )}

                  {/* Load More Button - Only show if not auto-loading */}
                  {!isLoading && !error && hasMore && !isLoadingMore && (
                    <div className="flex justify-center mt-8">
                      <button
                        onClick={loadMore}
                        className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 hover:border-[#5FCBC4]/50 text-white font-semibold transition-all flex items-center gap-2 group"
                      >
                        <span>Xem thêm {Math.min(ITEMS_PER_PAGE, allCurrentFlights.length - displayCount)} chuyến bay</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rotate-90" />
                      </button>
                    </div>
                  )}

                  {/* Showing count */}
                  {!isLoading && !error && (
                    <div className="text-center mt-6 text-sm text-[#94A3B8]">
                      Đang hiển thị {currentFlights.length} / {allCurrentFlights.length} chuyến bay
                      {allCurrentFlights.length === currentFlights.length && allCurrentFlights.length > ITEMS_PER_PAGE && (
                        <span className="ml-2 text-[#5FCBC4]">• Đã hiển thị tất cả</span>
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
                  <h3 className="text-xs uppercase tracking-wider text-[#94A3B8] font-bold mb-4">Selected Flights</h3>

                  {/* Departure */}
                  {selectedOutbound ? (
                    <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#64748B]">Departure • {formatBookingDate(dataBuildTour?.flight_departure_date || null)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white uppercase">{selectedOutbound.airline}</span>
                        <span className="text-sm font-bold text-[#5FCBC4]">{selectedOutbound.departureTime}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                      <div className="text-center py-4">
                        <p className="text-sm text-[#94A3B8]">No departure flight selected</p>
                      </div>
                    </div>
                  )}

                  {/* Return */}
                  {selectedReturn ? (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs text-[#64748B]">Return • {formatBookingDate(dataBuildTour?.flight_return_date || null)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-white uppercase">{selectedReturn.airline}</span>
                        <span className="text-sm font-bold text-[#5FCBC4]">{selectedReturn.departureTime}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10 border-dashed">
                      <div className="text-center py-4">
                        <p className="text-sm text-[#94A3B8]">No return flight selected</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Details */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-[#94A3B8] font-bold mb-4">Price Details</h3>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#475569]">Departure flight</span>
                      <span className="text-white font-semibold">
                        {selectedOutbound ? `${(selectedOutbound.price)}$` : '-'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#475569]">Return flight</span>
                      <span className="text-white font-semibold">
                        {selectedReturn ? `${(selectedReturn.price)}$` : '-'}
                      </span>
                    </div>

                    {/* Total */}
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex justify-between items-center p-4 rounded-xl bg-gradient-to-r from-[#5FCBC4]/10 to-[#4AB8B0]/10 border border-[#5FCBC4]/20">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-2xl font-bold text-[#5FCBC4]">{(totalPrice)}$</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 pb-8">
                <button
                  onClick={handleConfirmBooking}
                  disabled={!selectedOutbound || !selectedReturn}
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${selectedOutbound && selectedReturn
                    ? 'bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] hover:shadow-xl hover:shadow-[#4AB8B0]/40 text-[#FFFFFF] hover:scale-[1.02] cursor-pointer'
                    : 'bg-white/10 text-[#94A3B8] cursor-not-allowed opacity-50'
                    }`}
                >
                  Confirm Booking & Continue to Tour
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* End Two Column Layout */}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#1E293B]/80 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <p className="mb-2 text-sm uppercase tracking-[0.3em] text-[#94A3B8]">
              VietJourney
            </p>
            <h3 className="mb-4 text-xl font-semibold text-white">
              Connect and discover experiences over land
            </h3>
            <p className="mb-2 text-sm text-[#475569]">
              43 Building, 348 Arau They Street,
            </p>
            <p className="mb-2 text-sm text-[#475569]">
              Can Giay District, Ha Noi, Vietnam
            </p>
            <p className="text-sm text-[#475569]">
              help@vietjourneycommander.com
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Platform</h4>
              <ul className="space-y-2 text-sm text-[#475569]">
                <li><a href="#" className="hover:text-[#5FCBC4]">Tailored experiences</a></li>
                <li><a href="#" className="hover:text-[#5FCBC4]">Signature journeys</a></li>
                <li><a href="#" className="hover:text-[#5FCBC4]">Themed escapes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Support</h4>
              <ul className="space-y-2 text-sm text-[#475569]">
                <li><a href="#" className="hover:text-[#5FCBC4]">Help centre</a></li>
                <li><a href="#" className="hover:text-[#5FCBC4]">Terms of privacy</a></li>
                <li><a href="#" className="hover:text-[#5FCBC4]">Legal</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold text-white">Stay looped</h4>
              <p className="mb-3 text-sm text-[#475569]">
                Receive curated travel moments straight to your inbox
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email..."
                  className="h-10 flex-1 rounded-lg border border-white/20 bg-[rgba(7,18,26,0.92)] px-3 text-sm text-white placeholder:text-[#94A3B8] focus:border-[#5FCBC4] focus:outline-none"
                />
                <button className="rounded-lg bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] px-4 text-sm font-semibold text-[#FFFFFF] transition hover:scale-105">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-white/10 px-6 pt-8 text-center text-sm text-[#94A3B8]">
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

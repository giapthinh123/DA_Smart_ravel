"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { useAuthStore } from "@/store/useAuthStore"
import { PaymentService } from "@/services/payment.service"
import { Loader2, CheckCircle, AlertCircle, ChevronLeft } from "lucide-react"
import "@/style/dashboard.css"

interface DayCost {
  day_number: number
  day_cost: number
}

interface ItineraryPaymentData {
  itinerary_id: string
  user_id: string
  city_id: string
  trip_duration_days: number
  start_date: string
  guest_count: number
  budget: number
  summary?: {
    total_cost: number
    cost_per_person: number
    budget_utilized_percent: number
    avg_cost_per_day: number
    flight_total?: number
    total_places?: number
  }
  daily_itinerary?: Array<{
    day_number: number
    date: string
    day_cost: number
    blocks: Array<{
      block_type: string
      place: { name: string }
      estimated_cost: number
    }>
  }>
  book_flight?: boolean
  flights?: {
    selectedDepartureFlight?: { price: number; airline: string; departCode: string; arriveCode: string }
    selectedReturnFlight?: { price: number; airline: string; departCode: string; arriveCode: string }
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function PaymentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()
  const itineraryId = searchParams.get("itineraryId") || ""

  // State
  const [itineraryData, setItineraryData] = useState<ItineraryPaymentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    address: "",
    paymentMethod: "credit_card",
  })

  // Load itinerary data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("payment_itinerary_data")
      if (stored) {
        const parsed = JSON.parse(stored) as ItineraryPaymentData
        setItineraryData(parsed)
      }
    } catch (err) {
      console.error("Failed to load payment data:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Pre-fill user data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullname || "",
        email: user.email || "",
        phone: user.phone || "",
      }))
    }
  }, [user])

  const formatCardNumber = (value: string) => {
    return value
      .replace(/[^0-9]/g, "")             // chỉ cho số
      .replace(/(.{4})/g, "$1 ")          // thêm khoảng trắng sau mỗi 4 số
      .trim();                            // loại bỏ khoảng trắng cuối cùng
  };

  // Format expiry date as MM/DD, where MM is 01-12 and DD is 01-31
  // Output tối đa 5 ký tự (MM/DD hoặc MM/D hoặc M/D)
  const formatExpiryDate = (value: string) => {
    // Giữ số và lấy tối đa 4 số cho MMDD
    let digits = value.replace(/\D/g, "").slice(0, 4);

    let month = digits.slice(0, 2);
    let day = digits.slice(2, 4);

    // Xử lý tháng MM: 01-12
    if (month.length === 2) {
      let m = parseInt(month, 10);
      if (m === 0) month = "01";
      else if (m > 12) month = "12";
      else if (month[0] === '0' && month[1] === '0') month = '01';
    }

    // Xử lý ngày DD: 01-31
    if (day.length === 2) {
      let d = parseInt(day, 10);
      if (d === 0) day = "01";
      else if (d > 31) day = "31";
      else if (day[0] === '0' && day[1] === '0') day = '01';
    }

    let result = month;
    if (day.length) {
      result += '/' + day;
    }
    return result.slice(0, 5);
  };

  // Compute costs
  const dailyCosts: DayCost[] =
    itineraryData?.daily_itinerary?.map((day) => ({
      day_number: day.day_number,
      day_cost: day.day_cost,
    })) || []

  const flightCost =
    itineraryData?.book_flight && itineraryData?.flights
      ? (itineraryData.flights.selectedDepartureFlight?.price || 0) +
      (itineraryData.flights.selectedReturnFlight?.price || 0)
      : 0

  // Calculate total: use summary if available, otherwise sum daily costs + flight
  const dailyTotal = dailyCosts.reduce((sum, d) => sum + d.day_cost, 0)
  const totalAmount = itineraryData?.summary?.total_cost || (dailyTotal + flightCost) || 0

  // Handle form input
  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Handle payment submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!itineraryData) return

    if (totalAmount <= 0) {
      setPaymentError("Cannot process payment: total amount is $0. Please go back to your itinerary.")
      return
    }

    setIsSubmitting(true)
    setPaymentError(null)

    try {
      // 1. Create payment record
      const createRes = await PaymentService.createPayment({
        tour_id: itineraryData.itinerary_id,
        payment_type: "tour_booking",
        amount: totalAmount,
        currency: "USD",
        payment_method: formData.paymentMethod,
        payment_gateway: "manual",
        payment_details: {
          itinerary_summary: itineraryData.summary
            ? {
              total_cost: itineraryData.summary.total_cost,
              cost_per_person: itineraryData.summary.cost_per_person,
              budget_utilized_percent: itineraryData.summary.budget_utilized_percent,
              avg_cost_per_day: itineraryData.summary.avg_cost_per_day,
              flight_total: flightCost || undefined,
            }
            : undefined,
          flight_cost: flightCost || undefined,
          daily_costs: dailyCosts,
          guest_count: itineraryData.guest_count,
          trip_duration_days: itineraryData.trip_duration_days,
          city_id: itineraryData.city_id,
        },
      })

      const newPaymentId = createRes.payment.payment_id

      // 2. Simulate payment processing & confirm
      await new Promise((resolve) => setTimeout(resolve, 1500))

      await PaymentService.confirmPayment(newPaymentId)

      setPaymentId(newPaymentId)
      setPaymentSuccess(true)

      // Clean up localStorage
      localStorage.removeItem("payment_itinerary_data")
    } catch (err: any) {
      console.error("Payment failed:", err)
      setPaymentError(err.message || "Payment failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F0FDFA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#5FCBC4]" />
      </div>
    )
  }

  // No data
  if (!itineraryData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F0FDFA] text-[#3F3F46]">
        <AlertCircle className="h-16 w-16 text-amber-400" />
        <h2 className="text-2xl font-bold text-[#0F4C5C]">No Itinerary Data</h2>
        <p className="text-[#A1A1AA]">Please go back to your itinerary and proceed to payment from there.</p>
        <Link
          href="/planner"
          className="mt-4 rounded-xl bg-[#5FCBC4] px-6 py-3 font-semibold text-white transition hover:bg-[#4AB8B0] hover:scale-105"
        >
          Go to Planner
        </Link>
      </div>
    )
  }

  // Success state
  if (paymentSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#F0FDFA] text-[#3F3F46]">
        <div className="animate-bounce">
          <CheckCircle className="h-20 w-20 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-bold">Payment Successful!</h2>
        <p className="text-[#A1A1AA]">
          Your booking has been confirmed. Payment ID: <span className="font-mono text-[#5FCBC4]">{paymentId}</span>
        </p>
        <p className="text-lg font-semibold text-[#5FCBC4]">{formatCurrency(totalAmount)}</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => router.push(`/full_tour?itineraryId=${itineraryId}`)}
            className="rounded-xl border border-[#E4E4E7] bg-white px-6 py-3 font-semibold text-[#0F4C5C] transition hover:bg-[#CCFBF1]"
          >
            View Full Tour
          </button>
          <button
            onClick={() => router.push("/planner")}
            className="rounded-xl bg-[#5FCBC4] px-6 py-3 font-semibold text-white transition hover:bg-[#4AB8B0] hover:scale-105"
          >
            Back to Planner
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">
      {/* Header */}
      <header className="mx-auto max-w-6xl px-5 py-6 md:py-8 bg-[#F0FDFA]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-[#3F3F46] transition hover:text-[#0F4C5C]"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Back</span>
            </button>
            <div className="h-6 w-px bg-[#E4E4E7]" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#A1A1AA] md:text-sm">VietJourney</p>
              <p className="mt-1 text-lg font-semibold text-[#0F4C5C] md:text-xl">Checkout & Secure Payment</p>
            </div>
          </div>
          <nav className="hidden items-center gap-2 text-sm font-medium text-[#3F3F46] md:flex">
            <Link
              href="/planner"
              className="rounded-full px-3 py-1.5 text-[#3F3F46] transition hover:bg-[#CCFBF1] hover:text-[#0F4C5C]"
            >
              Planner
            </Link>
            <Link
              href="/history_tour"
              className="rounded-full px-3 py-1.5 text-[#3F3F46] transition hover:bg-[#CCFBF1] hover:text-[#0F4C5C]"
            >
              History
            </Link>
            <span className="mx-1 h-4 w-px bg-[#E4E4E7]" />
            <UserMenu />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl px-4 pb-10 md:px-5 md:pb-16">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:gap-8">
          {/* Left: Tour & price card */}
          <section className="overflow-hidden rounded-[2rem] border border-[#E4E4E7] bg-white shadow-sm">
            {/* Hero gradient */}
            <div className="relative h-44 w-full bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.38),transparent_55%)] mix-blend-screen" />
              <div className="absolute inset-0 flex flex-col justify-between p-5 text-white">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/35 backdrop-blur">
                    <span className="text-xs">✈️</span>
                  </span>
                  <span className="opacity-90">Tour Booking</span>
                </div>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
                    Your Travel Itinerary
                  </h1>
                  <p className="mt-1 max-w-xl text-xs text-[#E9F2FF]/90 md:text-[13px]">
                    Complete your booking for a {itineraryData.trip_duration_days}-day adventure with{" "}
                    {itineraryData.guest_count} travelers.
                  </p>
                </div>
              </div>
            </div>

            {/* Details body */}
            <div className="space-y-4 border-t border-[#E4E4E7] bg-white px-5 pb-5 pt-4 text-sm text-[#3F3F46] md:px-6 md:pb-6">
              {/* Meta */}
              <div className="flex flex-wrap gap-4 border-b border-[#E4E4E7] pb-3 text-xs md:text-[13px]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[15px] text-[#5FCBC4]">
                    📅
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#A1A1AA]">Duration</p>
                    <p className="font-medium text-[#0F4C5C]">{itineraryData.trip_duration_days} Days</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[15px] text-[#5FCBC4]">
                    👥
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#A1A1AA]">Participants</p>
                    <p className="font-medium text-[#0F4C5C]">{itineraryData.guest_count} People</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[15px] text-[#5FCBC4]">
                    📍
                  </span>
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#A1A1AA]">Start Date</p>
                    <p className="font-medium text-[#0F4C5C]">
                      {new Date(itineraryData.start_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Flight cost (if applicable) */}
              {flightCost > 0 && (
                <div className="flex items-center justify-between text-[13px]">
                  <span>
                    Flight cost
                    {itineraryData.flights?.selectedDepartureFlight && (
                      <span className="ml-1 text-[11px] text-[#A1A1AA]">
                        ({itineraryData.flights.selectedDepartureFlight.departCode} ↔{" "}
                        {itineraryData.flights.selectedDepartureFlight.arriveCode})
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-[#0F4C5C]">{formatCurrency(flightCost)}</span>
                </div>
              )}

              {/* Cost breakdown by day */}
              <div className="space-y-2 text-[13px] text-[#3F3F46]">
                {dailyCosts.map((day) => (
                  <div key={day.day_number} className="flex items-center justify-between">
                    <span>Cost of Day {day.day_number}</span>
                    <span className="font-medium text-[#0F4C5C]">{formatCurrency(day.day_cost)}</span>
                  </div>
                ))}
              </div>

              {/* Per person */}
              {itineraryData.summary && (
                <div className="flex items-center justify-between border-t border-dashed border-white/15 pt-2 text-[13px]">
                  <span className="text-[#A1A1AA]">Cost per person</span>
                  <span className="font-medium text-[#0F4C5C]">
                    {formatCurrency(itineraryData.summary.cost_per_person)}
                  </span>
                </div>
              )}

              {/* Total */}
              <div className="mt-1 flex items-center justify-between border-t border-dashed border-white/15 pt-3">
                <span className="text-[13px] font-semibold tracking-wide text-[#0F4C5C]">Total Amount</span>
                <span className="text-lg font-semibold text-[#5FCBC4] md:text-xl">{formatCurrency(totalAmount)}</span>
              </div>

              {/* Budget utilization */}
              {itineraryData.summary && (
                <div className="rounded-xl bg-[#F0FDFA] px-3 py-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#A1A1AA]">Budget utilization</span>
                    <span
                      className={`font-bold ${itineraryData.summary.budget_utilized_percent > 100 ? "text-red-400" : "text-emerald-400"
                        }`}
                    >
                      {itineraryData.summary.budget_utilized_percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all ${itineraryData.summary.budget_utilized_percent > 100
                        ? "bg-red-400"
                        : "bg-gradient-to-r from-[#5FCBC4] to-[#4AB8B0]"
                        }`}
                      style={{
                        width: `${Math.min(itineraryData.summary.budget_utilized_percent, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Secure payment note */}
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#CCFBF1] px-3 py-2 text-xs text-[#0F4C5C]">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#5FCBC4] text-[11px] text-white">
                  🔒
                </span>
                <p>Your payment is secure and encrypted.</p>
              </div>
            </div>
          </section>

          {/* Right: Payment form */}
          <section className="rounded-[2rem] border border-[#E4E4E7] bg-white shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-6 px-5 py-6 md:px-7 md:py-7">
              {/* Error message */}
              {paymentError && (
                <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Payment method */}
              <div>
                <h2 className="text-sm font-semibold text-[#0F4C5C] md:text-base">Payment Method</h2>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[
                    { value: "credit_card", label: "Credit Card", icon: "💳" },
                    { value: "bank_transfer", label: "Bank Transfer", icon: "🏦" },
                    { value: "e_wallet", label: "E-Wallet", icon: "📱" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, paymentMethod: method.value }))}
                      className={`rounded-xl border p-3 text-center text-xs transition ${formData.paymentMethod === method.value
                        ? "border-[#5FCBC4] bg-[#CCFBF1] text-[#0F4C5C]"
                        : "border-[#E4E4E7] bg-white text-[#3F3F46] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]"
                        }`}
                    >
                      <span className="block text-lg">{method.icon}</span>
                      <span className="mt-1 block">{method.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal information */}
              <div>
                <h2 className="text-sm font-semibold text-[#0F4C5C] md:text-base">Personal Information</h2>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInput}
                      required
                      placeholder="John Doe"
                      className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInput}
                      required
                      placeholder="john@example.com"
                      className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInput}
                      placeholder="+1 (555) 000-0000"
                      className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Card information - only show for credit card */}
              {formData.paymentMethod === "credit_card" && (
                <div>
                  <h2 className="text-sm font-semibold text-[#0F4C5C] md:text-base">Card Information</h2>
                  <div className="mt-4 space-y-4 text-sm">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                        Card Number
                      </label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formatCardNumber(formData.cardNumber)}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            cardNumber: e.target.value.replace(/\s/g, ""),
                          }))
                        }
                        maxLength={19}
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          name="expiryDate"
                          placeholder="MM/YY"
                          value={formData.expiryDate}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              expiryDate: formatExpiryDate(e.target.value),
                            }))
                          }
                          maxLength={5}
                          required
                          className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                          CVV
                        </label>
                        <input
                          type="text"
                          name="cvv"
                          value={formData.cvv}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              cvv: e.target.value.replace(/\D/g, "").substring(0, 4),
                            }))
                          }
                          inputMode="numeric"
                          placeholder="123"
                          maxLength={3}
                          className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Billing address */}
              <div>
                <h2 className="text-sm font-semibold text-[#0F4C5C] md:text-base">Billing Address</h2>
                <div className="mt-4 space-y-4 text-sm">
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.18em] text-[#A1A1AA]">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInput}
                      placeholder="123 Main Street, City, State 12345"
                      className="w-full rounded-xl border border-[#E4E4E7] bg-white px-3.5 py-2.5 text-sm text-[#3F3F46] placeholder:text-[#A1A1AA] focus:border-[#5FCBC4] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/30"
                    />
                  </div>
                </div>
              </div>

              {/* Pay button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#5FCBC4] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-transform hover:scale-[1.01] hover:bg-[#4AB8B0] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/60 focus:ring-offset-2 focus:ring-offset-[#F0FDFA] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[15px]">🔒</span>
                      <span className="truncate">Pay {formatCurrency(totalAmount)}</span>
                    </>
                  )}
                </button>
                <p className="mt-2 text-center text-[11px] text-[#A1A1AA]">
                  Payment is securely processed. Your booking will be confirmed immediately.
                </p>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <AuthGuard>
      <PaymentsContent />
    </AuthGuard>
  )
}

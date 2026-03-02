"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import "@/style/dashboard.css"
import JourneyBuilder from "@/components/dashboard/journey-builder"
import HotelsSearch from "@/components/dashboard/hotels-search"
import FlightsSearch from "@/components/dashboard/flights-search"
import ActivitiesSearch from "@/components/dashboard/activities_search"
import FoodSearch from "@/components/dashboard/food-search"
import { data_build_tour } from "@/types/domain"
import { AuthGuard } from "@/components/auth-guard"
import { UserMenu } from "@/components/user-menu"
import { Footer } from "@/components/footer"
import { useAuthStore } from "@/store/useAuthStore"

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [dataBuildTour, setDataBuildTour] = useState<data_build_tour>({
    departure: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    days: 0,
    budget: 0,
    adults: 0,
    children: 0,
    infants: 0,
    bookflight: false,
    flight_departure: null,
    flight_return: null,
    flight_departure_date: null,
    flight_return_date: null,
    departure_city_id: "",
    destination_city_id: "",
  })

  const quickAccessItems = [
    { title: "Personal tours", subtitle: "Craft bespoke travel stories with personal imprints" },
    { title: "Flights", subtitle: "Search flights for the departure and destination" },
    { title: "Hotels", subtitle: "Find curated and budget-aligned accommodation" },
    { title: "Food", subtitle: "Find restaurants and cafes" },
    { title: "Activities", subtitle: "Find curated and budget-aligned activities" },

  ]

  useEffect(() => {
    setSelectedItem(quickAccessItems[0].title)
  }, [])

  const handleItemClick = (index: number) => {
    setSelectedItem(quickAccessItems[index].title)
  }

  const renderSearchSection = () => {
    switch (selectedItem) {
      case "Personal tours":
        return <JourneyBuilder />
      case "Hotels":
        return <HotelsSearch />
      case "Flights":
        return <FlightsSearch data_build_tour={dataBuildTour} />
      case "Food":
        return <FoodSearch />
      case "Activities":
        return <ActivitiesSearch />
      default:
        return <JourneyBuilder />
    }
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F0FDFA] text-[#3F3F46]">

        {/* Header */}
        <header className="mx-auto max-w-7xl px-6 py-8 bg-[#F0FDFA]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-[#A1A1AA]">
                VietJourney
              </p>
              <p className="text-xl font-semibold text-[#0F4C5C]">
                Mapping Vietnam experiences
              </p>
            </div>
            <nav className="flex items-center gap-2 text-sm font-medium">
              <Link href="/" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                Home
              </Link>
              <Link href="/tours" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                Tours
              </Link>
              <Link href="/contact" className="rounded-full px-4 py-2 text-[#3F3F46] transition hover:text-[#0F4C5C] hover:bg-[#CCFBF1]">
                Contact
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
        <main className="mx-auto max-w-7xl px-6 py-10 pb-8">
          {/* Quick Access Cards */}
          <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickAccessItems.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-pressed={selectedItem === item.title}
                className={`group text-left rounded-2xl border p-5 transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4] focus-visible:ring-offset-2 ${selectedItem === item.title
                  ? 'border-[#5FCBC4] bg-[#CCFBF1] shadow-[0_4px_16px_rgba(95,203,196,0.25)]'
                  : 'bg-white border-[#E4E4E7] hover:bg-[#CCFBF1] hover:border-[#5FCBC4]'
                  }`}
                onClick={() => handleItemClick(index)}
              >
                <span className="mb-2 block font-semibold text-[#0F4C5C] transition-colors motion-reduce:transition-none">
                  {item.title}
                </span>
                <p className={`text-xs leading-relaxed transition-colors motion-reduce:transition-none ${selectedItem === item.title
                  ? 'text-[#3F3F46]'
                  : 'text-[#A1A1AA]'
                  }`}>
                  {item.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Dynamic Search Section */}
          <section className="relative mb-12 rounded-[2rem] bg-white shadow-sm z-10 overflow-hidden">
            {renderSearchSection()}

            {/* Login overlay – shown when not authenticated */}
            {!isAuthenticated && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-[2rem] backdrop-blur-sm bg-white/60">
                {/* Decorative ring */}
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#5FCBC4] bg-[#CCFBF1] shadow-lg">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7 text-[#0F4C5C]"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-[#0F4C5C]">
                  Đăng nhập để sử dụng chức năng này
                </h3>
                <p className="mb-6 max-w-xs text-center text-sm text-[#71717A]">
                  Vui lòng đăng nhập để truy cập công cụ lập kế hoạch và các tính năng cá nhân hoá.
                </p>

                <div className="flex gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-[#0F4C5C] px-6 py-2.5 text-sm font-medium text-white shadow transition hover:bg-[#0d3f4d] active:scale-95"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full border border-[#5FCBC4] px-6 py-2.5 text-sm font-medium text-[#0F4C5C] transition hover:bg-[#CCFBF1] active:scale-95"
                  >
                    Đăng ký
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Workflow Section */}
          <section className="mb-12 rounded-[2rem] border border-[#E4E4E7] bg-white p-10 shadow-sm">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[#A1A1AA]">
                Personalised Tour Workflow
              </p>
              <h2 className="text-3xl font-semibold text-[#0F4C5C]">
                Step-by-step to optimise every personalised journey
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-base text-[#3F3F46]">
                Complete the stages below once you choose a venue in the curated builder. Every detail is stored in a single dashboard so you can refine with complete control.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Step 01 */}
              <div className="rounded-3xl border border-[#E4E4E7] p-8 transition hover:border-[#5FCBC4] hover:bg-[#F0FDFA]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4] bg-[#CCFBF1] text-lg font-bold text-[#0F4C5C]">
                  01
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[#0F4C5C]">
                  Clarify your travel goals
                </h3>
                <p className="mb-4 text-sm text-[#3F3F46] leading-relaxed">
                  Choose traveller types, inspirations and budget so the system captures your core preferences first:
                </p>
                <ul className="space-y-2 text-sm text-[#3F3F46]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    State the place and exploration
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Pick top memories (culture or nature)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Set trip length and budget
                  </li>
                </ul>
              </div>

              {/* Step 02 */}
              <div className="rounded-3xl border border-[#E4E4E7] p-8 transition hover:border-[#5FCBC4] hover:bg-[#F0FDFA]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4] bg-[#CCFBF1] text-lg font-bold text-[#0F4C5C]">
                  02
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[#0F4C5C]">
                  Provide itinerary details
                </h3>
                <p className="mb-4 text-sm text-[#3F3F46] leading-relaxed">
                  Specify departure, destination, dates, and headcount to build the base schedule:
                </p>
                <ul className="space-y-2 text-sm text-[#3F3F46]">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Select the relevant venues (via dates)
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Provide precise travel dates
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Upload any fragment or add link
                  </li>
                </ul>
              </div>

              {/* Step 03 */}
              <div className="md:col-span-2 rounded-3xl border border-[#E4E4E7] p-8 transition hover:border-[#5FCBC4] hover:bg-[#F0FDFA]">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4] bg-[#CCFBF1] text-lg font-bold text-[#0F4C5C]">
                  03
                </div>
                <h3 className="mb-3 text-xl font-semibold text-[#0F4C5C]">
                  Receive and refine suggestions
                </h3>
                <p className="mb-4 text-sm text-[#3F3F46] leading-relaxed max-w-3xl">
                  Review automated suggestions and tune destinations, activities, and stays before finalising:
                </p>
                <ul className="grid gap-2 text-sm text-[#3F3F46] sm:grid-cols-2 max-w-4xl">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Compare accommodation tickets
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    Tune AI drag-and-drop logic
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[#5FCBC4]" />
                    View personalised journey for booking
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  )
}


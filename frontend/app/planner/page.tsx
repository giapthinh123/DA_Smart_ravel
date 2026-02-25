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

export default function DashboardPage() {
  const router = useRouter()
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
      <div className="relative min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B]">
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
              <Link href="/tours" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
                Tours
              </Link>
              <Link href="/contact" className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#0F172A]">
                Contact
              </Link>
              <span className="mx-2 h-4 w-px bg-white/20"></span>

              {/* User Menu Dropdown */}
              <UserMenu />
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="mx-auto max-w-7xl px-6 pb-8">
          {/* Quick Access Cards */}
          <div className="mb-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {quickAccessItems.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-pressed={selectedItem === item.title}
                className={`group text-left rounded-2xl border p-5 backdrop-blur transition-[background-color,border-color,box-shadow] duration-300 motion-reduce:transition-none touch-action-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D1820] ${selectedItem === item.title
                  ? 'border-[#5FCBC4] bg-gradient-to-br from-[#5FCBC4]/20 to-[#4AB8B0]/10 shadow-[0_8px_32px_rgba(255,229,180,0.3)]'
                  : 'border-white/10 bg-white/5 hover:border-[#5FCBC4]/40 hover:bg-white/[0.08]'
                  }`}
                onClick={() => handleItemClick(index)}
              >
                <span className={`mb-2 block font-semibold transition-colors motion-reduce:transition-none ${selectedItem === item.title
                  ? 'text-[#5FCBC4]'
                  : 'text-white group-hover:text-[#5FCBC4]'
                  }`}>
                  {item.title}
                </span>
                <p className={`text-xs leading-relaxed transition-colors motion-reduce:transition-none ${selectedItem === item.title
                  ? 'text-[#0F172A]'
                  : 'text-[#475569]'
                  }`}>
                  {item.subtitle}
                </p>
              </button>
            ))}
          </div>

          {/* Dynamic Search Section */}
          <section className="relative mb-16 rounded-[2.5rem] border border-white/10 bg-[#0D1820]/90 p-12 backdrop-blur overflow-visible z-10">
            {renderSearchSection()}
          </section>

          {/* Workflow Section */}
          <section className="mb-16 rounded-[2.5rem] border border-white/10 bg-white/6 p-12 backdrop-blur">
            <div className="mb-10 text-center">
              <p className="mb-3 text-xs uppercase tracking-[0.4em] text-[#94A3B8]">
                Personalised Tour Workflow
              </p>
              <h2 className="text-4xl font-semibold text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
                Step-by-step to optimise every personalised journey
              </h2>
              <p className="mx-auto mt-3 max-w-3xl text-base text-[#64748B]">
                Complete the stages below once you choose a venue in the curated builder. Every detail is stored in a single dashboard so you can refine with complete control.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Step 01 */}
              <div className="group rounded-3xl border border-white/10 bg-white/6 p-8 backdrop-blur transition hover:border-[#5FCBC4]/45 hover:bg-white/10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4]/70 bg-white/5 text-lg font-bold text-[#5FCBC4]">
                  01
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white group-hover:text-[#5FCBC4]">
                  Clarify your travel goals
                </h3>
                <p className="mb-4 text-sm text-[#475569] leading-relaxed">
                  Choose traveller types, inspirations and budget so the system captures your core preferences first:
                </p>
                <ul className="space-y-2 text-sm text-[#475569]">
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
              <div className="group rounded-3xl border border-white/10 bg-white/6 p-8 backdrop-blur transition hover:border-[#5FCBC4]/45 hover:bg-white/10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4]/70 bg-white/5 text-lg font-bold text-[#5FCBC4]">
                  02
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white group-hover:text-[#5FCBC4]">
                  Provide itinerary details
                </h3>
                <p className="mb-4 text-sm text-[#475569] leading-relaxed">
                  Specify departure, destination, dates, and headcount to build the base schedule:
                </p>
                <ul className="space-y-2 text-sm text-[#475569]">
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
              <div className="group md:col-span-2 rounded-3xl border border-white/10 bg-white/6 p-8 backdrop-blur transition hover:border-[#5FCBC4]/45 hover:bg-white/10">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#5FCBC4]/70 bg-white/5 text-lg font-bold text-[#5FCBC4]">
                  03
                </div>
                <h3 className="mb-3 text-xl font-semibold text-white group-hover:text-[#5FCBC4]">
                  Receive and refine suggestions
                </h3>
                <p className="mb-4 text-sm text-[#475569] leading-relaxed max-w-3xl">
                  Review automated suggestions and tune destinations, activities, and stays before finalising:
                </p>
                <ul className="grid gap-2 text-sm text-[#475569] sm:grid-cols-2 max-w-4xl">
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
        <footer className="mt-8 border-t border-white/10 bg-[#1E293B]/80 py-10 backdrop-blur">
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
                  <label htmlFor="subscribe-email" className="sr-only">Email address</label>
                  <input
                    id="subscribe-email"
                    type="email"
                    placeholder="Your email…"
                    className="h-10 flex-1 rounded-lg border border-white/20 bg-[rgba(7,18,26,0.92)] px-3 text-sm text-white placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none"
                  />
                  <button className="rounded-lg bg-gradient-to-r from-[#A8E6E0] via-[#7DD8D2] to-[#4AB8B0] px-4 text-sm font-semibold text-[#FFFFFF] transition-transform hover:scale-105">
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
    </AuthGuard>
  )
}


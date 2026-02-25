"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuthStore()
  // Featured Tours Data
  const featuredTours = [
    {
      name: "Hanoi - A Thousand Years of Civilization",
      description: "Discover Hanoi with its heroic historical stories and traditional cultural beauty.",
      duration: "5 days · 4 nights",
      price: "2,480",
      image: "https://marketplace.canva.com/wgNe8/MAFaRvwgNe8/1/tl/canva-hoan-kiem-lake-MAFaRvwgNe8.jpg",
    },
    {
      name: "Da Nang - The Coastal Paradise",
      description: "Discover the livable city with beautiful beaches, diverse cuisine, and iconic bridges.",
      duration: "3 days · 2 nights",
      price: "890",
      image: "https://media.vneconomy.vn/images/upload/2023/08/30/cau-vang-nag-tran-tuan-viet-5.jpg",
    },
    {
      name: "Paris - The City of Light",
      description: "The most romantic city in the world with ancient architecture, famous museums, and exquisite culinary experiences.",
      duration: "7 days · 6 nights",
      price: "3,950",
      image: "https://c4.wallpaperflare.com/wallpaper/150/935/583/paris-4k-download-beautiful-for-desktop-wallpaper-preview.jpg",
    },
  ]

  // Statistics Data
  const stats = [
    { label: "Optimized Journeys", value: "1.2K+" },
    { label: "Satisfied Customers", value: "98%" },
    { label: "Partner Countries", value: "16" },
  ]

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B]">
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>

      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#5FCBC4]">
              Smart Travel
            </p>
            <p className="text-xl font-semibold text-[#1E293B]">
              Discover the world your way
            </p>
          </div>
        </div>

        {/* Right: Auth Buttons / User Menu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/planner"
                className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#1E293B]"
              >
                Planner
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-[#5FCBC4] px-5 py-2 text-white font-medium transition hover:bg-[#4AB8B0]"
              >
                {user?.fullname || user?.email || 'Profile'}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-[#64748B] transition hover:text-[#1E293B]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#5FCBC4] px-5 py-2 text-white font-medium transition hover:bg-[#4AB8B0]"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-24 ">
        {/* Hero Section */}
        <section className="grid gap-10 lg:grid-cols-[1.25fr_1fr] ">
          <div className="space-y-8 pt-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#5FCBC4]/40 bg-[#E0F7FA] px-4 py-2 text-xs font-medium uppercase tracking-[0.35em] text-[#2A9D8F]">
              The First Tour Recommendation Platform in Vietnam
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-[#0F172A] sm:text-5xl">
              Create a personalized travel itinerary in minutes
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#64748B]">
              Smart Travel helps you design your own journey: choose departure/arrival points, book round-trip flights, select favorite restaurants, hotels, and locations, and instantly receive an optimized daily schedule.            </p>

            {/* Statistics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-[#5FCBC4]/20 bg-white/80 p-4 backdrop-blur shadow-sm transition hover:border-[#5FCBC4]/50 hover:shadow-md"
                  style={{
                    animation: `floatSlow ${18 + index * 2}s ease-in-out infinite ${index * 1.2}s`,
                  }}
                >
                  <p className="relative text-3xl font-semibold text-[#5FCBC4]">
                    {stat.value}
                  </p>
                  <p className="relative mt-1 text-xs uppercase tracking-[0.3em] text-[#94A3B8]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={isAuthenticated ? "/planner" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-[#5FCBC4] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4AB8B0] shadow-lg shadow-[#5FCBC4]/25"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Planning Now"}
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#tours"
                className="inline-flex items-center gap-2 rounded-full border border-[#5FCBC4]/30 px-6 py-3 text-sm font-semibold text-[#1E293B] transition hover:border-[#5FCBC4] hover:bg-[#E0F7FA]"
              >
                View Tours
              </a>
            </div>
          </div>

          {/* Suggested Itinerary Card */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-[#5FCBC4]/20 via-transparent to-transparent blur-[70px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#5FCBC4]/15 bg-white/90 p-4 backdrop-blur shadow-xl shadow-[#5FCBC4]/10 transition duration-500 hover:border-[#5FCBC4]/40 hover:shadow-2xl">
              {/* Header */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.4em] text-[#5FCBC4]">
                  Smart Travel Planner
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#0F172A]">
                  Suggested Itinerary Overview
                </h3>
              </div>

              {/* Tour Cards */}
              <div className="space-y-5">
                {featuredTours.map((tour, index) => (
                  <article
                    key={tour.name}
                    className="group flex gap-5 rounded-2xl border border-gray-100 bg-[#F8FFFE] p-5 transition duration-500 hover:border-[#5FCBC4]/30 hover:shadow-md"
                    style={{
                      animation: `floatSlow ${16 + index * 1.5}s ease-in-out infinite ${index * 0.8}s`,
                    }}
                  >
                    <div className="relative h-24 w-32 flex-shrink-0 overflow-hidden rounded-xl">
                      <img
                        src={tour.image}
                        alt={tour.name}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#1E293B]">
                          {tour.name}
                        </h4>
                        <p className="mt-1.5 text-xs text-[#64748B] leading-relaxed">
                          {tour.description}
                        </p>
                      </div>
                      <div className="mt-3 text-xs text-[#5FCBC4] font-medium">
                        {tour.duration}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer Note */}
              <p className="mt-8 text-sm text-[#64748B] leading-relaxed">
                The Smart Travel AI algorithm updates flight status, accommodation availability, and optimizes the daily itinerary for the whole group.
              </p>
            </div>
          </div>
        </section>



        {/* Featured Tours Section */}
        <section id="tours" className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#5FCBC4]">
                Popular Destinations
              </p>
              <h2 className="text-4xl font-semibold text-[#0F172A]">
                Featured Tours
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[#64748B] leading-relaxed">
                Explore curated travel experiences designed by our AI and refined by local experts
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredTours.map((tour, index) => (
              <article
                key={tour.name}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm backdrop-blur transition duration-500 hover:border-[#5FCBC4]/40 hover:shadow-xl hover:shadow-[#5FCBC4]/10"
                style={{
                  animation: `floatSlow ${18 + index * 1.4}s ease-in-out infinite ${index * 0.9}s`,
                }}
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img
                    src={tour.image}
                    alt={tour.name}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/30" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-[#1E293B] transition-colors group-hover:text-[#5FCBC4]">
                      {tour.name}
                    </h3>
                    <p className="text-sm text-[#64748B] leading-relaxed">
                      {tour.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-[#5FCBC4]">
                    <span>{tour.duration}</span>
                    <span className="text-base">from ${tour.price}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1E293B]/10 bg-[#1E293B] py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-[#94A3B8] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Smart Travel. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition hover:text-[#5FCBC4]">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-[#5FCBC4]">
              Terms of Use
            </a>
            <a href="#" className="transition hover:text-[#5FCBC4]">
              Support Center
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

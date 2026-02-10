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
    <div className="relative min-h-screen bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7]">
      <style jsx global>{`
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-14px); }
        }
      `}</style>

      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0B1217] via-[#0B1217]/40 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:80px_80px] opacity-20" />
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#7D837A]">
              Smart Travel
            </p>
            <p className="text-xl font-semibold text-[#F3F0E9]">
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
                className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
              >
                Planner
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-[#C4A77D] px-5 py-2 text-[#111418] transition hover:bg-[#d6b88b]"
              >
                {user?.fullname || user?.email || 'Profile'}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#C4A77D] px-5 py-2 text-[#111418] transition hover:bg-[#d6b88b]"
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
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C4A77D]/70 bg-[#1A242C] px-4 py-2 text-xs font-medium uppercase tracking-[0.35em] text-[#C4A77D]">
              The First Tour Recommendation Platform in Vietnam
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-[#F3F0E9] sm:text-5xl">
              Create a personalized travel itinerary in minutes
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#A5ABA3]">
              Smart Travel helps you design your own journey: choose departure/arrival points, book round-trip flights, select favorite restaurants, hotels, and locations, and instantly receive an optimized daily schedule.            </p>

            {/* Statistics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:border-[#FFE5B4]/40"
                  style={{
                    animation: `floatSlow ${18 + index * 2}s ease-in-out infinite ${index * 1.2}s`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.24),transparent_60%)] opacity-60 transition group-hover:opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-25 transition group-hover:opacity-50" />
                  <p className="relative text-3xl font-semibold text-white drop-shadow-[0_10px_25px_rgba(255,199,128,0.35)]">
                    {stat.value}
                  </p>
                  <p className="relative mt-1 text-xs uppercase tracking-[0.3em] text-[#D0D7D8]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={isAuthenticated ? "/planner" : "/register"}
                className="inline-flex items-center gap-2 rounded-full bg-[#C4A77D] px-6 py-3 text-sm font-semibold text-[#111418] transition hover:bg-[#d6b88b]"
              >
                {isAuthenticated ? "Go to Dashboard" : "Start Planning Now"}
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#tours"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-6 py-3 text-sm font-semibold text-[#F3F0E9] transition hover:border-white/30"
              >
                View Tours
              </a>
            </div>
          </div>

          {/* Suggested Itinerary Card */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-[#FFE4C4]/40 via-transparent to-transparent blur-[70px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#15212A]/85 p-4 backdrop-blur transition duration-500 hover:border-[#FFE5B4]/40 hover:shadow-[0_32px_80px_-20px_rgba(255,201,138,0.35)]">
              <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/12 to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,232,190,0.35),transparent_60%)] opacity-60" />

              {/* Header */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.4em] text-[#7D837A]">
                  Smart Travel Planner
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#F3F0E9]">
                  Suggested Itinerary Overview
                </h3>
              </div>

              {/* Tour Cards */}
              <div className="space-y-5">
                {featuredTours.map((tour, index) => (
                  <article
                    key={tour.name}
                    className="group flex gap-5 rounded-2xl border border-white/10 bg-white/5 p-5 transition duration-500 hover:border-[#FFE5B4]/50 hover:bg-white/8 hover:shadow-[0_20px_60px_-25px_rgba(255,199,128,0.45)]"
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
                      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white drop-shadow-[0_10px_18px_rgba(0,0,0,0.32)]">
                          {tour.name}
                        </h4>
                        <p className="mt-1.5 text-xs text-[#D0D7D8] leading-relaxed">
                          {tour.description}
                        </p>
                      </div>
                      <div className="mt-3 text-xs text-[#FFE5B4] font-medium">
                        {tour.duration}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Footer Note */}
              <p className="mt-8 text-sm text-[#D0D7D8] leading-relaxed">
                The Smart Travel AI algorithm updates flight status, accommodation availability, and optimizes the daily itinerary for the whole group.
              </p>
            </div>
          </div>
        </section>



        {/* Featured Tours Section */}
        <section id="tours" className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#7D837A]">
                Popular Destinations
              </p>
              <h2 className="text-4xl font-semibold text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
                Featured Tours
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[#A5ABA3] leading-relaxed">
                Explore curated travel experiences designed by our AI and refined by local experts
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredTours.map((tour, index) => (
              <article
                key={tour.name}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/7 backdrop-blur transition duration-500 hover:border-[#FFE5B4]/45 hover:bg-white/10 hover:shadow-[0_32px_88px_-42px_rgba(255,199,128,0.6)]"
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
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/60" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.35),transparent_50%)] opacity-70" />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-white drop-shadow-[0_16px_20px_rgba(0,0,0,0.45)] transition-colors group-hover:text-[#FFE5B4]">
                      {tour.name}
                    </h3>
                    <p className="text-sm text-[#D0D7D8] leading-relaxed">
                      {tour.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm font-medium text-[#FFE5B4]">
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
      <footer className="border-t border-white/10 bg-[#061017]/80 py-10 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 text-sm text-[#D0D7D8] sm:flex-row sm:items-center sm:justify-between">
          <p className="drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
            © {new Date().getFullYear()} Smart Travel. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition hover:text-[#FFE5B4]">
              Privacy Policy
            </a>
            <a href="#" className="transition hover:text-[#FFE5B4]">
              Terms of Use
            </a>
            <a href="#" className="transition hover:text-[#FFE5B4]">
              Support Center
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

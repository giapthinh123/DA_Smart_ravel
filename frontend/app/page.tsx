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

  // Signature Experiences Data
  const signatureExperiences = [
    {
      title: "Smart Flight Integration",
      description: "Automatically sync your flight schedule with your itinerary for seamless travel planning.",
    },
    {
      title: "AI-Powered Suggestions",
      description: "Get personalized recommendations based on your preferences and travel style.",
    },
    {
      title: "Detailed Itineraries",
      description: "Every day is planned with activities, meals, and rest time perfectly balanced.",
    },
    {
      title: "Budget Synchronization",
      description: "Track expenses in real-time and stay within your budget effortlessly.",
    },
  ]

  // Travel Stories Data
  const travelStories = [
    {
      quote: "Smart Travel helped me discover the thousand-year history of Hanoi through perfectly planned routes. Every day was filled with cultural wonders!",
      author: "Huong Nguyen · History Enthusiast",
    },
    {
      quote: "The Da Nang itinerary was amazing! From the Golden Bridge to pristine beaches, everything was seamlessly organized. Highly recommend!",
      author: "Tan Pham · Beach Lover",
    },
  ]

  // Statistics Data
  const stats = [
    { label: "Optimized Journeys", value: "1.2K+" },
    { label: "Satisfied Customers", value: "98%" },
    { label: "Partner Countries", value: "36" },
  ]

  // Planning Steps Data
  const planningSteps = [
    {
      title: "Share Your Dreams",
      description: "Tell us your destination, budget, and travel preferences.",
    },
    {
      title: "AI Creates Magic",
      description: "Our smart algorithm designs a personalized itinerary just for you.",
    },
    {
      title: "Embark & Enjoy",
      description: "Follow your plan and make unforgettable memories.",
    },
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

        {/* Center: Navigation */}
        <nav className="flex items-center gap-2 text-sm font-medium">
          <a
            href="#experience"
            className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
          >
            Experience
          </a>
          <a
            href="#tours"
            className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
          >
            Featured Tours
          </a>
          <a
            href="#stories"
            className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
          >
            Stories
          </a>
        </nav>

        {/* Right: Auth Buttons / User Menu */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2 text-[#A5ABA3] transition hover:text-[#F3F0E9]"
              >
                Dashboard
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
                href={isAuthenticated ? "/dashboard" : "/register"}
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

        {/* Signature Experiences Section */}
        <section
          id="experience"
          className="space-y-8 rounded-[2.8rem] border border-white/10 bg-white/6 p-12 backdrop-blur-lg shadow-[0_55px_120px_-60px_rgba(0,0,0,0.6)]"
        >
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div className="absolute -left-16 -top-16 h-32 w-32 rounded-full bg-gradient-to-br from-[#FFEBC9]/60 via-transparent to-transparent blur-[80px]" />
            <div className="absolute -right-12 top-2 h-28 w-28 rounded-full bg-gradient-to-br from-[#97E8FF]/55 via-transparent to-transparent blur-[70px]" />
            <div className="relative space-y-3">
              <h2 className="text-4xl font-semibold text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
                Signature Experience
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[#A5ABA3] leading-relaxed">
                Advanced features designed to make your travel planning effortless and enjoyable
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-xs uppercase tracking-[0.4em] text-[#7D837A]">
              Features
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {signatureExperiences.map((item, index) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 p-7 backdrop-blur transition duration-500 hover:border-[#FFE5B4]/45 hover:bg-white/10 hover:shadow-[0_30px_80px_-45px_rgba(255,199,128,0.55)]"
                style={{
                  animation: `floatSlow ${20 + index * 1.8}s ease-in-out infinite ${index * 1.1}s`,
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.28),transparent_60%)] opacity-80 transition group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent" />
                <h3 className="relative text-xl font-semibold text-white drop-shadow-[0_12px_20px_rgba(0,0,0,0.32)] transition-colors group-hover:text-[#FFE5B4]">
                  {item.title}
                </h3>
                <p className="relative mt-3 text-sm text-[#D0D7D8] leading-relaxed">{item.description}</p>
                <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-gradient-to-br from-[#FFEDCF]/40 via-transparent to-transparent blur-[70px]" />
              </div>
            ))}
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
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-[#F3F0E9] transition hover:border-[#C4A77D] hover:bg-[#C4A77D]/10 hover:text-[#C4A77D]"
            >
              {isAuthenticated ? "My Dashboard" : "Get Personalized Tours"}
            </Link>
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

        {/* Travel Stories Section */}
        <section
          id="stories"
          className="grid gap-10 rounded-[2.8rem] border border-white/10 bg-white/6 p-12 backdrop-blur-lg shadow-[0_55px_140px_-65px_rgba(0,0,0,0.65)] lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="h-px w-12 bg-gradient-to-r from-[#FFE5B4] to-transparent" />
                <p className="text-xs uppercase tracking-[0.4em] text-[#7D837A]">
                  Traveler Voices
                </p>
              </div>
              <h2 className="text-4xl font-semibold text-white drop-shadow-[0_12px_24px_rgba(255,199,128,0.45)]">
                Real Stories from Real Travelers
              </h2>
              <p className="text-base text-[#A5ABA3] leading-relaxed">
                Discover how Smart Travel has transformed journeys for thousands of adventurers
              </p>
            </div>
            <div className="grid gap-5">
              {travelStories.map((story, index) => (
                <blockquote
                  key={story.author}
                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 p-7 backdrop-blur transition duration-500 hover:border-[#FFE5B4]/45 hover:bg-white/10 hover:shadow-[0_32px_90px_-46px_rgba(255,199,128,0.55)]"
                  style={{
                    animation: `floatSlow ${24 + index * 2}s ease-in-out infinite ${index * 1.2}s`,
                  }}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_65%)] opacity-80" />
                  <p className="relative text-base italic text-white drop-shadow-[0_14px_22px_rgba(0,0,0,0.35)] leading-relaxed">
                    "{story.quote}"
                  </p>
                  <footer className="relative mt-4 text-sm font-medium text-[#FFE5B4]">
                    — {story.author}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>

          {/* Planning Steps Card */}
          <div className="relative flex flex-col justify-between gap-8 rounded-[2.4rem] border border-white/10 bg-white/7 p-8 backdrop-blur shadow-[0_40px_110px_-70px_rgba(0,0,0,0.65)] transition duration-500 hover:border-[#FFE5B4]/45 hover:bg-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_60%)] opacity-80" />
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br from-[#FFE5B4]/40 via-transparent to-transparent blur-[95px]" />
            <div className="absolute -left-14 bottom-8 h-36 w-36 rounded-full bg-gradient-to-tr from-[#91E3FF]/35 via-transparent to-transparent blur-[85px]" />
            <div className="relative">
              <h3 className="text-2xl font-semibold text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.4)]">
                How It Works
              </h3>
              <ol className="mt-6 space-y-5">
                {planningSteps.map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 border-[#FFE5B4]/70 text-sm font-semibold text-[#FFE5B4]">
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-base font-semibold text-white drop-shadow-[0_12px_20px_rgba(0,0,0,0.35)]">
                        {step.title}
                      </p>
                      <p className="text-sm text-[#D0D7D8] leading-relaxed">{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Member Perks Card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/8 p-8 text-white shadow-[0_28px_80px_-45px_rgba(255,199,128,0.5)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.38),transparent_60%)] opacity-90" />
              <div className="relative space-y-4">
                <p className="text-sm uppercase tracking-[0.35em] text-[#FFE5B4]">
                  Exclusive
                </p>
                <h4 className="text-2xl font-semibold text-white drop-shadow-[0_16px_32px_rgba(0,0,0,0.45)]">
                  Premium Member Benefits
                </h4>
                <p className="text-base text-[#F4F7F8] leading-relaxed">
                  Join today and unlock exclusive discounts, priority support, and VIP experiences
                </p>
                <Link
                  href={isAuthenticated ? "/dashboard" : "/register"}
                  className="inline-flex items-center gap-2 rounded-full bg-[#C4A77D] px-6 py-3 text-sm font-semibold text-[#111418] transition hover:bg-[#d6b88b] hover:shadow-lg"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Join Now"}
                  <span aria-hidden>→</span>
                </Link>
              </div>
              <div className="pointer-events-none absolute -right-16 -bottom-14 h-40 w-40 rounded-full bg-gradient-to-br from-[#FFD7A0]/45 via-transparent to-transparent blur-[110px]" />
              <div className="pointer-events-none absolute -left-14 -top-16 h-36 w-36 rounded-full bg-gradient-to-br from-[#FFE5B4]/40 via-transparent to-transparent blur-[90px]" />
            </div>
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

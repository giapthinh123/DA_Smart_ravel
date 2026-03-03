"use client"

import React from "react"
import Link from "next/link"
import { useAuthStore } from "@/store/useAuthStore"
import { useTranslations, useLocale } from "next-intl"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"

export default function Home() {
  const { isAuthenticated, user } = useAuthStore()
  const locale = useLocale()
  const t = useTranslations("HomePage")
  const tHeader = useTranslations("Header")
  const tFooter = useTranslations("Footer")
  const isVi = locale === "vi"

  // Featured Tours Data — dùng locale để chọn đúng ngôn ngữ
  const featuredTours = [
    {
      name: isVi ? "Hà Nội - Nghìn Năm Văn Hiến" : "Hanoi - A Thousand Years of Civilization",
      description: isVi
        ? "Khám phá Hà Nội với những câu chuyện lịch sử hào hùng và vẻ đẹp văn hóa truyền thống."
        : "Discover Hanoi with its heroic historical stories and traditional cultural beauty.",
      duration: isVi ? "5 ngày · 4 đêm" : "5 days · 4 nights",
      price: "2,480",
      image: "https://marketplace.canva.com/wgNe8/MAFaRvwgNe8/1/tl/canva-hoan-kiem-lake-MAFaRvwgNe8.jpg",
    },
    {
      name: isVi ? "Đà Nẵng - Thiên Đường Biển" : "Da Nang - The Coastal Paradise",
      description: isVi
        ? "Khám phá thành phố đáng sống với những bãi biển đẹp, ẩm thực đa dạng và những cây cầu biểu tượng."
        : "Discover the livable city with beautiful beaches, diverse cuisine, and iconic bridges.",
      duration: isVi ? "3 ngày · 2 đêm" : "3 days · 2 nights",
      price: "890",
      image: "https://media.vneconomy.vn/images/upload/2023/08/30/cau-vang-nag-tran-tuan-viet-5.jpg",
    },
    {
      name: isVi ? "Paris - Kinh đô Ánh sáng" : "Paris - The City of Light",
      description: isVi
        ? "Thành phố lãng mạn nhất thế giới với kiến trúc cổ kính, bảo tàng nổi tiếng và trải nghiệm ẩm thực tinh tế."
        : "The most romantic city in the world with ancient architecture, famous museums, and exquisite culinary experiences.",
      duration: isVi ? "7 ngày · 6 đêm" : "7 days · 6 nights",
      price: "3,950",
      image: "https://c4.wallpaperflare.com/wallpaper/150/935/583/paris-4k-download-beautiful-for-desktop-wallpaper-preview.jpg",
    },
  ]

  // Statistics Data
  const stats = [
    { label: t("statJourneys"), value: "1.2K+" },
    { label: t("statSatisfied"), value: "98%" },
    { label: t("statCountries"), value: "16" },
  ]

  return (
    <div className="relative min-h-screen bg-[#F0FDFA] text-[#3F3F46]">

      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(204,251,241,0.4)_0%,rgba(240,253,250,0)_60%)]" />
      </div>

      {/* Header */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[#5FCBC4]">
              Smart Travel
            </p>
            <p className="text-xl font-semibold text-[#0F4C5C]">
              {t("brandTagline")}
            </p>
          </div>
        </div>

        {/* Right: Nav + Language Switcher + Auth */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {isAuthenticated ? (
            <>
              <Link
                href="/planner"
                className="rounded-full px-4 py-2 text-[#A1A1AA] transition hover:text-[#0F4C5C]"
              >
                {tHeader("planner")}
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-[#5FCBC4] px-5 py-2 text-white font-medium transition hover:bg-[#4AB8B0]"
              >
                {user?.fullname || user?.email || tHeader("profile")}
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/planner"
                className="rounded-full px-4 py-2 text-[#A1A1AA] transition hover:text-[#0F4C5C]"
              >
                {tHeader("planner")}
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-[#5FCBC4] px-5 py-2 text-white font-medium transition hover:bg-[#4AB8B0]"
              >
                {t("getStarted")}
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
              {t("badge")}
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-[#0F4C5C] sm:text-5xl">
              {t("heroHeadline")}
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-[#3F3F46]">
              {t("heroDescription")}
            </p>

            {/* Statistics */}
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white p-4 shadow-sm transition hover:border-[#5FCBC4]/50 hover:shadow-md"
                  style={{
                    animation: `floatSlow ${18 + index * 2}s ease-in-out infinite ${index * 1.2}s`,
                  }}
                >
                  <p className="relative text-3xl font-semibold text-[#5FCBC4]">
                    {stat.value}
                  </p>
                  <p className="relative mt-1 text-xs uppercase tracking-[0.3em] text-[#A1A1AA]">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href={isAuthenticated ? "/planner" : "/login"}
                className="inline-flex items-center gap-2 rounded-full bg-[#5FCBC4] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4AB8B0] shadow-lg shadow-[#5FCBC4]/25"
              >
                {isAuthenticated ? t("ctaDashboard") : t("ctaStartPlanning")}
                <span aria-hidden>→</span>
              </Link>
              <a
                href="#tours"
                className="inline-flex items-center gap-2 rounded-full border border-[#E4E4E7] px-6 py-3 text-sm font-semibold text-[#3F3F46] transition hover:border-[#5FCBC4] hover:bg-[#CCFBF1]"
              >
                {t("ctaViewTours")}
              </a>
            </div>
          </div>

          {/* Suggested Itinerary Card */}
          <div className="relative">
            <div className="absolute -inset-3 rounded-[2.2rem] bg-gradient-to-br from-[#CCFBF1]/60 via-transparent to-transparent blur-[70px]" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#E4E4E7] bg-white p-4 shadow-xl transition duration-500 hover:border-[#5FCBC4]/40 hover:shadow-2xl">
              {/* Card Header */}
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.4em] text-[#5FCBC4]">
                  {t("itineraryLabel")}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-[#0F4C5C]">
                  {t("itineraryTitle")}
                </h3>
              </div>

              {/* Tour Cards */}
              <div className="space-y-5">
                {featuredTours.map((tour, index) => (
                  <article
                    key={tour.name}
                    className="group flex gap-5 rounded-2xl border border-[#E4E4E7] bg-white p-5 transition duration-500 hover:border-[#5FCBC4]/30 hover:bg-[#CCFBF1]/20 hover:shadow-md"
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
                        <h4 className="text-sm font-semibold text-[#0F4C5C]">
                          {tour.name}
                        </h4>
                        <p className="mt-1.5 text-xs text-[#3F3F46] leading-relaxed">
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
              <p className="mt-8 text-sm text-[#A1A1AA] leading-relaxed">
                {t("itineraryNote")}
              </p>
            </div>
          </div>
        </section>



        {/* Featured Tours Section */}
        <section id="tours" className="space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.4em] text-[#5FCBC4]">
                {t("popularDestinations")}
              </p>
              <h2 className="text-4xl font-semibold text-[#0F4C5C]">
                {t("featuredTours")}
              </h2>
              <p className="mt-3 max-w-2xl text-base text-[#3F3F46] leading-relaxed">
                {t("toursDescription")}
              </p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featuredTours.map((tour, index) => (
              <article
                key={tour.name}
                className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#E4E4E7] bg-white shadow-sm transition duration-500 hover:border-[#5FCBC4]/40 hover:shadow-xl hover:shadow-[#5FCBC4]/10"
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
                    <h3 className="text-xl font-semibold text-[#0F4C5C] transition-colors group-hover:text-[#5FCBC4]">
                      {tour.name}
                    </h3>
                    <p className="text-sm text-[#3F3F46] leading-relaxed">
                      {tour.description}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-[#E4E4E7] flex items-center justify-between text-sm font-medium text-[#5FCBC4]">
                    <span>{tour.duration}</span>
                    <span className="text-base">{t("from")} ${tour.price}</span>
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
            © {new Date().getFullYear()} {tFooter("copyright")}
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="#" className="transition hover:text-[#5FCBC4]">
              {tFooter("privacy")}
            </a>
            <a href="#" className="transition hover:text-[#5FCBC4]">
              {tFooter("terms")}
            </a>
            <a href="#" className="transition hover:text-[#5FCBC4]">
              {tFooter("support")}
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

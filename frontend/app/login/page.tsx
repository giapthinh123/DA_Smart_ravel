"use client"

import type React from "react"
import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { LoaderCircle } from "lucide-react"
import { EyeIcon, EyeCloseIcon } from "@/components/icon/icon"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { getOrCreateDeviceId } from "@/lib/device-fingerprint"

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("LoginPage")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      const deviceId = getOrCreateDeviceId()

      await login({
        email,
        password,
        device_id: deviceId
      })
      router.push("/planner")
    } catch (error: any) {
      if (error.error_type === 'device_mismatch') {
      } else if (error.error_type === 'device_verification_required') {
        router.push(`/verify-device?email=${encodeURIComponent(email)}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
      </div>

      {/* Language Switcher — top right */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-[#0F172A]">
            {t("title")}
          </h1>
          <p className="text-base text-[#64748B] mt-2 max-w-md mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid gap-6">
            <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-6 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  {t("cardTitle")}
                </h2>
              </div>

              <div className="grid gap-5">
                {/* Email Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    {t("emailLabel")}
                  </label>
                  <div className="relative">
                    <input
                      tabIndex={1}
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder={t("emailPlaceholder")}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <div className="flex items-center">
                    <label
                      htmlFor="password"
                      className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                    >
                      {t("passwordLabel")}
                    </label>
                    <Link
                      href="/reset-password"
                      className="ml-auto text-xs text-[#5FCBC4] transition hover:text-[#4AB8B0] underline decoration-[#5FCBC4]/30 underline-offset-4 hover:decoration-[#4AB8B0]/50"
                    >
                      {t("forgotPassword")}
                    </Link>
                  </div>
                  <div className="relative">
                    <input
                      tabIndex={2}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("passwordPlaceholder")}
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                    {password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors focus:outline-none z-10"
                        aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      >
                        {showPassword ? (
                          <EyeCloseIcon className="w-5 h-5" />
                        ) : (
                          <EyeIcon className="w-5 h-5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-[#5FCBC4] text-sm font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em]">
                    {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    {isLoading ? t("signingIn") : t("signInButton")}
                  </span>
                </button>
              </div>
            </div>

            {/* Register Card */}
            <div className="rounded-3xl border border-[#5FCBC4]/15 bg-white/80 p-6 text-center text-sm text-[#64748B] backdrop-blur-2xl shadow-md">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                {t("newHere")}
              </p>
              <p className="mb-4 text-sm">
                {t("newHereDesc")}
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-sm text-[#5FCBC4] transition hover:text-[#4AB8B0] underline decoration-[#5FCBC4]/30 underline-offset-4 hover:decoration-[#4AB8B0]/50"
              >
                {t("createAccount")}
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

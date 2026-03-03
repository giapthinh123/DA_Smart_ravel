"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle, CheckCircle2 } from "lucide-react"
import { EyeIcon, EyeCloseIcon } from "@/components/icon/icon"
import { AuthService } from "@/services/auth.service"
// ========================================
// INPUT ERROR COMPONENT
// ========================================
function InputError({
  message,
  className = '',
}: {
  message?: string
  className?: string
}) {
  return message ? (
    <p className={`text-sm text-red-400 mt-1 ${className}`}>
      {message}
    </p>
  ) : null
}

type ErrorMap = Record<string, string | undefined>

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  })
  const [errors, setErrors] = useState<ErrorMap>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validateForm = () => {
    const newErrors: ErrorMap = {}

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required"
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters"
    }

    if (!formData.email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!formData.password) {
      newErrors.password = "Password is required"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters"
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required"
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await AuthService.register(formData)
      setShowSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Registration error:", error)
      setErrors({ email: "Registration failed. Please try again." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      const { [field]: _, ...remainingErrors } = errors
      setErrors(remainingErrors)
    }
  }

  const isFormValid =
    formData.fullName.length >= 2 &&
    /\S+@\S+\.\S+/.test(formData.email) &&
    formData.password.length >= 6 &&
    formData.password === formData.confirmPassword &&
    /^\+?[\d\s-()]+$/.test(formData.phone)

  if (showSuccess) {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7] overflow-hidden">
        {/* Background Layers */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
          <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0B1217] via-[#0B1217]/40 to-transparent" />
        </div>

        <div className="w-full max-w-lg z-10">
          <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-8 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)] text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-500/20 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-400" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                Registration Successful!
              </h2>
              <p className="text-[#D0D7D8] text-base">
                Your account has been created successfully. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#09131A] via-[#12303B] to-[#1A3D4B] text-[#F6F1E7] overflow-hidden">
      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(11,24,31,0.92),rgba(14,31,41,0.55)_42%,rgba(26,61,75,0.75))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0)_70%)] mix-blend-overlay opacity-75" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0B1217] via-[#0B1217]/40 to-transparent" />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
            Create Account
          </h1>
          <p className="text-base text-[#A5ABA3] mt-2 max-w-md mx-auto">
            Join us to explore amazing tours and destinations
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid gap-6">
            <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-6 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)]">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-lg font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                  Sign Up
                </h2>
                <p className="text-sm text-[#D0D7D8]">
                  Fill in your information to get started
                </p>
              </div>

              <div className="grid gap-5">
                {/* Full Name Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="fullName"
                    className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Enter your full name…"
                      className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.fullName} />
                </div>

                {/* Email Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="info@example.com…"
                      className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.email} />
                </div>

                {/* Phone Number Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="phone"
                    className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      autoComplete="tel"
                      placeholder="+1 (555) 000-0000…"
                      className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.phone} />
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Create a strong password…"
                      className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 pr-12 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B6C2C6] hover:text-[#FFE5B4] transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeIcon className="size-5" />
                      ) : (
                        <EyeCloseIcon className="size-5" />
                      )}
                    </button>
                  </div>
                  <InputError message={errors.password} />
                </div>

                {/* Confirm Password Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Confirm your password…"
                      className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 pr-12 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B6C2C6] hover:text-[#FFE5B4] transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="size-5" />
                      ) : (
                        <EyeCloseIcon className="size-5" />
                      )}
                    </button>
                  </div>
                  <InputError message={errors.confirmPassword} />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-sm font-semibold text-[#2B1200] shadow-[0_25px_70px_-20px_rgba(255,186,102,0.85)] transition-all hover:scale-[1.04] hover:shadow-[0_38px_98px_-30px_rgba(255,186,102,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFEED0]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1820] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                  disabled={!isFormValid || isLoading}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  >
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,255,255,0.65),transparent_55%),radial-gradient(circle_at_85%_45%,rgba(255,255,255,0.5),transparent_60%)] mix-blend-screen" />
                    <span className="absolute left-[-40%] top-1/2 h-[220%] w-[65%] -translate-y-1/2 rotate-[18deg] bg-white/70 blur-[60px] opacity-50" />
                  </span>
                  <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em] text-[#2B1200] drop-shadow-[0_10px_25px_rgba(255,225,190,0.6)]">
                    {isLoading && (
                      <LoaderCircle className="h-4 w-4 animate-spin text-[#2B1200]" />
                    )}
                    {isLoading ? "Creating account..." : "Register"}
                  </span>
                </button>
              </div>
            </div>

            {/* Login Card */}
            <div className="rounded-3xl border border-white/15 bg-[rgba(8,23,31,0.75)] p-6 text-center text-sm text-[#D0D7D8] backdrop-blur-2xl shadow-[0_28px_90px_-55px_rgba(0,0,0,0.62)]">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#FFE5B4]">
                Already Have an Account?
              </p>
              <p className="mb-4 text-sm">
                Sign in to continue your journey
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[#7EE0FF] transition hover:text-[#FFE5B4] underline decoration-[#7EE0FF]/30 underline-offset-4 hover:decoration-[#FFE5B4]/50"
              >
                Sign In
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

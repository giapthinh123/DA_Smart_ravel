"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle, CheckCircle2 } from "lucide-react"
import { EyeIcon, EyeCloseIcon } from "@/components/icon/icon"

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
    <p className={`text-sm text-red-500 mt-1 ${className}`}>
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
      const registrationData = {
        email: formData.email,
        password: formData.password,
        fullname: formData.fullName,
        phone: formData.phone,
      }
      
      sessionStorage.setItem('registration_data', JSON.stringify(registrationData))
      
      setTimeout(() => {
        setIsLoading(false)
        router.push('/register/payment')
      }, 500)
    } catch (error) {
      console.error('Error saving registration data:', error)
      setIsLoading(false)
      alert('Có lỗi xảy ra. Vui lòng thử lại.')
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
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
        {/* Background Layers */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        </div>

        <div className="w-full max-w-lg z-10">
          <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-8 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10 text-center space-y-6">
            <div className="flex justify-center">
              <div className="rounded-full bg-[#5FCBC4]/15 p-4">
                <CheckCircle2 className="h-16 w-16 text-[#5FCBC4]" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-bold text-[#0F172A]">
                Registration Successful!
              </h2>
              <p className="text-[#64748B] text-base">
                Your account has been created successfully. Redirecting to login...
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/60 via-white/20 to-transparent" />
      </div>

      <div className="w-full max-w-lg z-10">
        {/* Title and Description */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-semibold text-[#0F172A]">
            Create Account
          </h1>
          <p className="text-base text-[#64748B] mt-2 max-w-md mx-auto">
            Join us to explore amazing tours and destinations
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="grid gap-6">
            <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-6 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
              <div className="mb-6 space-y-2 text-center">
                <h2 className="text-lg font-semibold text-[#0F172A]">
                  Sign Up
                </h2>
                <p className="text-sm text-[#64748B]">
                  Fill in your information to get started
                </p>
              </div>

              <div className="grid gap-5">
                {/* Full Name Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="fullName"
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="Enter your full name…"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.fullName} />
                </div>

                {/* Email Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="email"
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="info@example.com…"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.email} />
                </div>

                {/* Phone Number Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="phone"
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      autoComplete="tel"
                      placeholder="+1 (555) 000-0000…"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                  </div>
                  <InputError message={errors.phone} />
                </div>

                {/* Password Field */}
                <div className="grid gap-2">
                  <label
                    htmlFor="password"
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Create a strong password…"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors cursor-pointer"
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
                    className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Confirm your password…"
                      className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowConfirmPassword(prev => !prev)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors cursor-pointer"
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
                  className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-[#5FCBC4] text-sm font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#5FCBC4]"
                  disabled={!isFormValid || isLoading}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em]">
                    {isLoading && (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "Creating account..." : "Register"}
                  </span>
                </button>
              </div>
            </div>

            {/* Login Card */}
            <div className="rounded-3xl border border-[#5FCBC4]/15 bg-white/80 p-6 text-center text-sm text-[#64748B] backdrop-blur-2xl shadow-md">
              <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                Already Have an Account?
              </p>
              <p className="mb-4 text-sm">
                Sign in to continue your journey
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-[#5FCBC4] transition hover:text-[#4AB8B0] underline decoration-[#5FCBC4]/30 underline-offset-4 hover:decoration-[#4AB8B0]/50"
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

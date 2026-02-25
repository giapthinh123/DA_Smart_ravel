"use client"

import type React from "react"
import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { LoaderCircle, CheckIcon } from "lucide-react"
import { EyeIcon, EyeCloseIcon } from "@/components/icon/icon"
import { Toast } from 'primereact/toast';

export default function LoginPage() {
  const toast = useRef<Toast>(null);
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const login = useAuthStore((state) => state.login)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsLoading(true)
      console.log('🔑 Login with remember:', remember) // Debug log
      await login({ email, password, remember })
      router.push("/planner")
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
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
              Welcome Back
            </h1>
            <p className="text-base text-[#64748B] mt-2 max-w-md mx-auto">
              Sign in to continue your journey
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="grid gap-6">
              <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-6 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
                <div className="mb-6 space-y-2 text-center">
                  <h2 className="text-lg font-semibold text-[#0F172A]">
                    Sign In
                  </h2>
                  <p className="text-sm text-[#64748B]">
                    Enter your credentials to access your account
                  </p>
                </div>

                <div className="grid gap-5">
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
                        tabIndex={1}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="info@example.com…"
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[#d34e4e]">
                    {errorMessage}
                  </p>
                  {/* Password Field */}
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <label
                        htmlFor="password"
                        className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium"
                      >
                        Password
                      </label>
                      <Link
                        href="/reset-password"
                        className="ml-auto text-xs text-[#5FCBC4] transition hover:text-[#4AB8B0] underline decoration-[#5FCBC4]/30 underline-offset-4 hover:decoration-[#4AB8B0]/50"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <input
                        tabIndex={2}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        // required
                        placeholder="Enter your password…"
                        className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                      />
                      {password && (
                        <button
                          key="password-toggle"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors focus:outline-none z-10"
                          aria-label={showPassword ? "Hide password" : "Show password"}
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

                  {/* Remember Me Checkbox */}
                  <div className="flex items-center space-x-3 rounded-2xl border border-gray-100 bg-[#F8FFFE] p-3">
                    <div className="relative">
                      <input
                        tabIndex={3}
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer size-4 shrink-0 rounded-[4px] border border-[#5FCBC4]/70 bg-transparent checked:bg-[#5FCBC4] checked:border-[#5FCBC4] focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/50 focus:ring-offset-2 focus:ring-offset-white transition-all cursor-pointer appearance-none"
                      />
                      <CheckIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <label
                      htmlFor="remember"
                      className="text-sm text-[#5FCBC4] cursor-pointer select-none"
                    >
                      Keep me logged in
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-[#5FCBC4] text-sm font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#5FCBC4]"
                    disabled={isLoading}
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em]">
                      {isLoading && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                      Sign In
                    </span>
                  </button>
                </div>
              </div>

              {/* Register Card */}
              <div className="rounded-3xl border border-[#5FCBC4]/15 bg-white/80 p-6 text-center text-sm text-[#64748B] backdrop-blur-2xl shadow-md">
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                  New Here?
                </p>
                <p className="mb-4 text-sm">
                  Create an account to start your journey
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm text-[#5FCBC4] transition hover:text-[#4AB8B0] underline decoration-[#5FCBC4]/30 underline-offset-4 hover:decoration-[#4AB8B0]/50"
                >
                  Create Account
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

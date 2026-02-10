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
              Welcome Back
            </h1>
            <p className="text-base text-[#A5ABA3] mt-2 max-w-md mx-auto">
              Sign in to continue your journey
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="grid gap-6">
              <div className="rounded-3xl border border-white/15 bg-[rgba(10,25,33,0.9)] p-6 backdrop-blur-2xl shadow-[0_32px_110px_-60px_rgba(0,0,0,0.75)]">
                <div className="mb-6 space-y-2 text-center">
                  <h2 className="text-lg font-semibold text-white drop-shadow-[0_18px_32px_rgba(0,0,0,0.4)]">
                    Sign In
                  </h2>
                  <p className="text-sm text-[#D0D7D8]">
                    Enter your credentials to access your account
                  </p>
                </div>

                <div className="grid gap-5">
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
                        tabIndex={1}
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="info@example.com…"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
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
                        className="text-sm uppercase tracking-[0.25em] text-[#FFE5B4]"
                      >
                        Password
                      </label>
                      <Link
                        href="/reset-password"
                        className="ml-auto text-xs text-[#7EE0FF] transition hover:text-[#FFE5B4] underline decoration-[#7EE0FF]/30 underline-offset-4 hover:decoration-[#FFE5B4]/50"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 opacity-65" />
                      <input
                        tabIndex={2}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        // required
                        placeholder="Enter your password…"
                        className="h-12 w-full rounded-2xl border border-white/20 bg-[rgba(7,18,26,0.92)] px-4 pr-12 text-white placeholder:text-[#B6C2C6] focus-visible:border-[#FFE5B4] focus-visible:ring-2 focus-visible:ring-[#FFE5B4]/30 focus-visible:outline-none transition-colors"
                      />
                      {password && (
                        <button
                          key="password-toggle"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B6C2C6] hover:text-[#FFE5B4] transition-colors focus:outline-none z-10"
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
                  <div className="flex items-center space-x-3 rounded-2xl border border-white/15 bg-[rgba(7,20,28,0.68)] p-3">
                    <div className="relative">
                      <input
                        tabIndex={3}
                        id="remember"
                        type="checkbox"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="peer size-4 shrink-0 rounded-[4px] border border-[#FFE5B4]/70 bg-transparent checked:bg-[#FFE5B4] checked:border-[#FFE5B4] focus:outline-none focus:ring-2 focus:ring-[#FFE5B4]/50 focus:ring-offset-2 focus:ring-offset-[#0A1820] transition-all cursor-pointer appearance-none"
                      />
                      <CheckIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-3 text-[#0A1820] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <label
                      htmlFor="remember"
                      className="text-sm text-[#11d4ee] cursor-pointer select-none"
                    >
                      Keep me logged in
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="group relative mt-1 h-12 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-sm font-semibold text-[#2B1200] shadow-[0_25px_70px_-20px_rgba(255,186,102,0.85)] transition-all hover:scale-[1.04] hover:shadow-[0_38px_98px_-30px_rgba(255,186,102,0.95)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFEED0]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1820] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                    disabled={isLoading}
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
                      Sign In
                    </span>
                  </button>
                </div>
              </div>

              {/* Register Card */}
              <div className="rounded-3xl border border-white/15 bg-[rgba(8,23,31,0.75)] p-6 text-center text-sm text-[#D0D7D8] backdrop-blur-2xl shadow-[0_28px_90px_-55px_rgba(0,0,0,0.62)]">
                <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#FFE5B4]">
                  New Here?
                </p>
                <p className="mb-4 text-sm">
                  Create an account to start your journey
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 text-sm text-[#7EE0FF] transition hover:text-[#FFE5B4] underline decoration-[#7EE0FF]/30 underline-offset-4 hover:decoration-[#FFE5B4]/50"
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

"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "@/lib/toast"
import { LoaderCircle, Mail, Shield } from "lucide-react"
import { useTranslations } from "next-intl"
import { getOrCreateDeviceId } from "@/lib/device-fingerprint"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"

export default function VerifyDevicePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("VerifyDevicePage")
  
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  
  useEffect(() => {
    const emailParam = searchParams.get("email")
    if (!emailParam) {
      router.push("/login")
    } else {
      setEmail(emailParam)
    }
  }, [searchParams, router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast.error(t("invalidCodeLength"), t("error"))
      return
    }
    
    setIsLoading(true)
    try {
      const deviceId = getOrCreateDeviceId()
      // Use same origin as current page for API calls
      const apiBase = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'
      
      console.log('=== VERIFY DEVICE REQUEST ===')
      console.log('API Base:', apiBase)
      console.log('Email:', email)
      console.log('Code:', code)
      console.log('Device ID:', deviceId)
      
      const response = await fetch(`${apiBase}/api/auth/verify-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.trim(),
          device_id: deviceId,
          device_name: navigator.userAgent
        })
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      const data = await response.json()
      console.log('Response data:', data)
      
      if (response.ok && data.auth_token) {
        // Save tokens
        localStorage.setItem('auth_token', data.auth_token)
        localStorage.setItem('user_data', JSON.stringify(data.user))
        if (data.refresh_token) {
          localStorage.setItem('refresh_token', data.refresh_token)
        }
        
        toast.success(t("success"), t("successTitle"))
        router.push("/planner")
      } else {
        toast.error(data.msg || t("invalidCode"), t("error"))
      }
    } catch (error) {
      toast.error(t("errorGeneric"), t("error"))
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] p-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
      </div>
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      
      <div className="w-full max-w-md z-10">
        <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-8 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center">
              <Mail className="h-8 w-8 text-[#5FCBC4]" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-2xl font-bold text-[#0F172A] mb-2 text-center">{t("title")}</h1>
          <p className="text-[#64748B] mb-6 text-center">{t("subtitle")}</p>
          
          {/* Email display */}
          <div className="mb-6 p-3 rounded-xl bg-[#F8FFFE] border border-gray-200">
            <p className="text-xs text-[#64748B] mb-1">{t("sentTo")}</p>
            <p className="text-sm font-medium text-[#0F172A]">{email}</p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium block mb-2">
                {t("codeLabel")}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="123456"
                className="h-14 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-center text-2xl tracking-widest font-mono focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                autoFocus
              />
              <p className="text-xs text-[#64748B] mt-2 text-center">{t("codeHint")}</p>
            </div>
            
            {/* Warning */}
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 flex items-start gap-3">
              <Shield className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">{t("warning")}</p>
            </div>
            
            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || code.length !== 6}
              className="w-full h-12 rounded-2xl bg-[#5FCBC4] text-white font-semibold shadow-lg shadow-[#5FCBC4]/30 hover:bg-[#4AB8B0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <LoaderCircle className="h-5 w-5 animate-spin mx-auto" />
              ) : (
                t("verify")
              )}
            </button>
          </form>
          
          {/* Back to login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push("/login")}
              className="text-sm text-[#5FCBC4] hover:text-[#4AB8B0] transition-colors"
            >
              {t("backToLogin")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

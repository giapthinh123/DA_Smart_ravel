"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CheckCircle2,
  Crown,
  Sparkles,
  Shield,
  Gift,
  Star,
  CreditCard,
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  MapPin,
  Zap
} from "lucide-react"
import { toast } from "@/lib/toast"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslations } from "next-intl"

// ========================================
// MEMBERSHIP BENEFITS DATA
// ========================================
// ========================================
// MAIN COMPONENT
// ========================================
interface RegistrationData {
  email: string
  password: string
  fullname: string
  phone: string
}

export default function RegisterPaymentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("RegisterPaymentPage")
  const [selectedPlan, setSelectedPlan] = useState("yearly")
  const [isProcessing, setIsProcessing] = useState(false)
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null)

  // Move arrays to render cycle to access translations
  const MEMBERSHIP_BENEFITS = [
    {
      icon: Crown,
      title: t("benefits.premium.title"),
      description: t("benefits.premium.desc"),
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      icon: MapPin,
      title: t("benefits.unlimited.title"),
      description: t("benefits.unlimited.desc"),
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      icon: Users,
      title: t("benefits.support.title"),
      description: t("benefits.support.desc"),
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
  ]

  const PRICING_PLANS = [
    {
      id: "monthly",
      name: t("plans.monthly.name"),
      price: 199000,
      duration: t("plans.monthly.duration"),
      savings: null,
      popular: false
    },
    {
      id: "yearly",
      name: t("plans.yearly.name"),
      price: 1990000,
      duration: t("plans.yearly.duration"),
      savings: t("plans.yearly.savings"),
      popular: true
    },
    {
      id: "lifetime",
      name: t("plans.lifetime.name"),
      price: 4990000,
      duration: t("plans.lifetime.duration"),
      savings: t("plans.lifetime.savings"),
      popular: false
    }
  ]

  useEffect(() => {
    const data = sessionStorage.getItem('registration_data')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        setRegistrationData(parsed)
      } catch (error) {
        console.error('Error parsing registration data:', error)
        router.push('/register')
      }
    } else {
      router.push('/register')
    }
  }, [])

  const currentPlan = PRICING_PLANS.find(p => p.id === selectedPlan)

  const handlePayment = async () => {
    if (!registrationData) {
      toast.warning(t("toast.missingDataDesc"), t("toast.missingDataTitle"))
      router.push('/register')
      return
    }

    setIsProcessing(true)

    try {
      const plan = PRICING_PLANS.find(p => p.id === selectedPlan)
      if (!plan) {
        throw new Error('Invalid plan selected')
      }

      const amount_usd = plan.price / 25000

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000'
      const response = await fetch(`${apiBase}/api/payments/vnpay/create-payment-url-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: registrationData.email,
          password: registrationData.password,
          fullname: registrationData.fullname,
          phone: registrationData.phone,
          plan_id: selectedPlan,
          order_info: `Thanh toan dang ky tai khoan premium - ${plan.name}`
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create payment URL')
      }

      const data = await response.json()

      if (data.payment_url) {
        sessionStorage.removeItem('registration_data')
        window.location.href = data.payment_url
      } else {
        throw new Error('No payment URL returned')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setIsProcessing(false)
      toast.error(error instanceof Error ? error.message : t("toast.paymentFailedDesc"), t("toast.paymentFailedTitle"))
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
      {/* Background Layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-[#5FCBC4]/20 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#5FCBC4] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            {t("goBack")}
          </button>

          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5FCBC4]/10 border border-[#5FCBC4]/20 mb-4">
            <Star className="h-4 w-4 text-[#5FCBC4]" />
            <span className="text-sm font-medium text-[#5FCBC4]">{t("finalStep")}</span>
          </div>
          <h1 className="text-4xl font-bold text-[#0F172A] mb-3">
            {t("title")}
          </h1>
          <p className="text-lg text-[#64748B] max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">

          {/* Left Column - Benefits (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center">
                  <Crown className="h-5 w-5 text-[#5FCBC4]" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F172A]">
                  {t("memberBenefits")}
                </h2>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {MEMBERSHIP_BENEFITS.map((benefit, index) => {
                  const Icon = benefit.icon
                  return (
                    <div
                      key={index}
                      className="group relative rounded-2xl border border-gray-200 bg-white p-5 hover:border-[#5FCBC4]/30 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${benefit.bgColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-6 w-6 ${benefit.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#0F172A] mb-1.5 text-base">
                            {benefit.title}
                          </h3>
                          <p className="text-sm text-[#64748B] leading-relaxed">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <CheckCircle2 className="h-5 w-5 text-[#5FCBC4]" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Payment (1/3 width) */}
          <div className="lg:col-span-1 space-y-6">

            {/* Plan Selection */}
            <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10 p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">
                {t("selectPlanLabel")}
              </h3>

              <div className="space-y-3">
                {PRICING_PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${selectedPlan === plan.id
                      ? "border-[#5FCBC4] bg-[#5FCBC4]/5 shadow-lg"
                      : "border-gray-200 bg-white hover:border-[#5FCBC4]/30"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-[#0F172A]">
                            {plan.name}
                          </h4>
                          {plan.popular && (
                            <span className="px-2 py-0.5 rounded-full bg-[#5FCBC4] text-white text-xs font-medium">
                              {t("popular")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {plan.duration}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan === plan.id
                        ? "border-[#5FCBC4] bg-[#5FCBC4]"
                        : "border-gray-300"
                        }`}>
                        {selectedPlan === plan.id && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-[#0F172A]">
                        {plan.price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    {plan.savings && (
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-50 border border-green-200">
                        <Gift className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-700">
                          {plan.savings}
                        </span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10 p-6">
              <h3 className="text-lg font-bold text-[#0F172A] mb-4">
                {t("paymentInfo")}
              </h3>

              {registrationData && (
                <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="text-xs text-[#64748B] mb-1">{t("registeredEmail")}</p>
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {registrationData.email}
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[#64748B]">{t("selectedPlan")}</span>
                  <span className="text-sm font-medium text-[#0F172A]">
                    {currentPlan?.name}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-[#64748B]">{t("durationLabel")}</span>
                  <span className="text-sm font-medium text-[#0F172A]">
                    {currentPlan?.duration}
                  </span>
                </div>

                <div className="h-px bg-gray-200 my-2" />

                <div className="flex justify-between items-center py-2">
                  <span className="text-base font-semibold text-[#0F172A]">
                    {t("totalPayment")}
                  </span>
                  <span className="text-2xl font-bold text-[#5FCBC4]">
                    {currentPlan?.price.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Payment Button */}
              <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="group relative w-full h-12 overflow-hidden rounded-2xl bg-[#5FCBC4] text-sm font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-[#5FCBC4]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-[1rem] font-semibold tracking-[0.03em]">
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t("processing")}
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      {t("payNow")}
                    </>
                  )}
                </span>
              </button>

              {/* Payment Methods Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-center text-[#64748B] mb-2">
                  {t("acceptedMethods")}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-xs font-medium text-[#64748B]">VNPAY</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-xs font-medium text-[#64748B]">MoMo</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200">
                    <span className="text-xs font-medium text-[#64748B]">Visa</span>
                  </div>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#64748B]">
                <Shield className="h-4 w-4 text-green-600" />
                <span>{t("securePayment")}</span>
              </div>
            </div>

            {/* Money Back Guarantee */}
            <div className="rounded-2xl border border-green-200 bg-green-50/50 backdrop-blur-sm p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-green-900 text-sm mb-1">
                    {t("guaranteeTitle")}
                  </h4>
                  <p className="text-xs text-green-700 leading-relaxed">
                    {t("guaranteeDesc")}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

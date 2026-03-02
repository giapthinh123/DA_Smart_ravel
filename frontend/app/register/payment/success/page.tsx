"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Sparkles, ArrowRight, Home, XCircle, AlertCircle } from "lucide-react"
import confetti from "canvas-confetti"

const PLAN_NAMES: Record<string, string> = {
  monthly: "Gói tháng",
  yearly: "Gói năm",
  lifetime: "Trọn đời"
}

function PaymentSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)
  const [status, setStatus] = useState<string>('success')
  const [paymentId, setPaymentId] = useState<string>('')
  const [planId, setPlanId] = useState<string>('')

  useEffect(() => {
    const statusParam = searchParams.get('status') || 'success'
    const paymentIdParam = searchParams.get('payment_id') || ''
    const planIdParam = searchParams.get('plan') || ''
    
    setStatus(statusParam)
    setPaymentId(paymentIdParam)
    setPlanId(planIdParam)

    if (statusParam !== 'success') {
      return
    }

    // Fire confetti animation only on success
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    const interval = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)
      
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)

    return () => clearInterval(interval)
  }, [searchParams])

  useEffect(() => {
    if (status !== 'success') {
      return
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      router.push("/login")
    }
  }, [countdown, router, status])

  if (status === 'cancelled') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        </div>

        <div className="w-full max-w-2xl z-10">
          <div className="rounded-3xl border border-gray-300 bg-white/90 p-12 backdrop-blur-2xl shadow-2xl text-center space-y-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-gray-100 p-6">
                <XCircle className="h-20 w-20 text-gray-500" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-[#0F172A]">
                Đã hủy thanh toán
              </h1>
              
              <p className="text-lg text-[#64748B] max-w-lg mx-auto leading-relaxed">
                Bạn đã hủy giao dịch. Bạn có thể quay lại đăng ký bất kỳ lúc nào.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => router.push("/register")}
                className="group relative w-full h-14 overflow-hidden rounded-2xl bg-[#5FCBC4] text-base font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-semibold tracking-[0.03em]">
                  Thử lại
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="group w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-sm font-medium text-[#64748B] transition-all hover:border-[#5FCBC4]/30 hover:bg-[#5FCBC4]/5 hover:text-[#5FCBC4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'failed' || status === 'error') {
    return (
      <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] text-[#1E293B] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
        </div>

        <div className="w-full max-w-2xl z-10">
          <div className="rounded-3xl border border-red-200 bg-white/90 p-12 backdrop-blur-2xl shadow-2xl text-center space-y-8">
            <div className="flex justify-center">
              <div className="rounded-full bg-red-100 p-6">
                <AlertCircle className="h-20 w-20 text-red-500" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-[#0F172A]">
                Thanh toán thất bại
              </h1>
              
              <p className="text-lg text-[#64748B] max-w-lg mx-auto leading-relaxed">
                Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ nếu vấn đề tiếp tục xảy ra.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => router.push("/register")}
                className="group relative w-full h-14 overflow-hidden rounded-2xl bg-[#5FCBC4] text-base font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 font-semibold tracking-[0.03em]">
                  Thử lại
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              <button
                onClick={() => router.push("/")}
                className="group w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-sm font-medium text-[#64748B] transition-all hover:border-[#5FCBC4]/30 hover:bg-[#5FCBC4]/5 hover:text-[#5FCBC4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
              >
                <span className="flex items-center justify-center gap-2">
                  <Home className="h-4 w-4" />
                  Về trang chủ
                </span>
              </button>
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
      </div>

      <div className="w-full max-w-2xl z-10">
        <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-12 backdrop-blur-2xl shadow-2xl shadow-[#5FCBC4]/20 text-center space-y-8">
          
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[#5FCBC4]/20 animate-ping" />
              <div className="relative rounded-full bg-gradient-to-br from-[#5FCBC4] to-[#4AB8B0] p-6">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5FCBC4]/10 border border-[#5FCBC4]/20">
              <Sparkles className="h-4 w-4 text-[#5FCBC4]" />
              <span className="text-sm font-medium text-[#5FCBC4]">Thanh toán thành công</span>
            </div>
            
            <h1 className="text-4xl font-bold text-[#0F172A]">
              Chào mừng bạn đến với Smart Travel!
            </h1>
            
            <p className="text-lg text-[#64748B] max-w-lg mx-auto leading-relaxed">
              Tài khoản Premium của bạn đã được kích hoạt thành công với {planId ? PLAN_NAMES[planId] || 'gói đã chọn' : 'gói đã chọn'}. Bạn có thể bắt đầu khám phá và lên kế hoạch cho những chuyến đi tuyệt vời.
            </p>

            {paymentId && (
              <div className="inline-block px-4 py-2 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-xs text-[#64748B] mb-1">Mã thanh toán</p>
                <p className="text-sm font-mono font-medium text-[#0F172A]">
                  {paymentId}
                </p>
              </div>
            )}
          </div>

          {/* Benefits Reminder */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200">
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="font-semibold text-yellow-900 text-sm mb-1">
                Voucher 500K
              </h3>
              <p className="text-xs text-yellow-700">
                Đã gửi vào email
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200">
              <div className="text-3xl mb-2">✨</div>
              <h3 className="font-semibold text-purple-900 text-sm mb-1">
                Ưu đãi độc quyền
              </h3>
              <p className="text-xs text-purple-700">
                Giảm giá đặc biệt
              </p>
            </div>
            
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200">
              <div className="text-3xl mb-2">🛡️</div>
              <h3 className="font-semibold text-blue-900 text-sm mb-1">
                Bảo hiểm du lịch
              </h3>
              <p className="text-xs text-blue-700">
                Miễn phí toàn bộ
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4 pt-4">
            <button
              onClick={() => router.push("/login")}
              className="group relative w-full h-14 overflow-hidden rounded-2xl bg-[#5FCBC4] text-base font-semibold text-white shadow-lg shadow-[#5FCBC4]/30 transition-all hover:bg-[#4AB8B0] hover:shadow-xl hover:shadow-[#5FCBC4]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 font-semibold tracking-[0.03em]">
                Đăng nhập ngay
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>

            <button
              onClick={() => router.push("/")}
              className="group w-full h-12 rounded-2xl border-2 border-gray-200 bg-white text-sm font-medium text-[#64748B] transition-all hover:border-[#5FCBC4]/30 hover:bg-[#5FCBC4]/5 hover:text-[#5FCBC4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/80 focus-visible:ring-offset-2"
            >
              <span className="flex items-center justify-center gap-2">
                <Home className="h-4 w-4" />
                Về trang chủ
              </span>
            </button>
          </div>

          {/* Auto Redirect Notice */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-[#64748B]">
              Tự động chuyển đến trang đăng nhập sau{" "}
              <span className="font-semibold text-[#5FCBC4]">{countdown}s</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5FCBC4] mx-auto mb-4" />
          <p className="text-[#64748B]">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}

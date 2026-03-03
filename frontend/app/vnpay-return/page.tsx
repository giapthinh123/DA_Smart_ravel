"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle, XCircle, AlertCircle, Loader2, Home, FileText } from "lucide-react"
import Link from "next/link"

interface VnpayResult {
    code: string
    message: string
    payment_id: string
    transaction_no: string
    amount_vnd: number
    bank_code: string
    pay_date: string
    status: "completed" | "failed" | "cancelled"
}

function VnpayReturnContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [result, setResult] = useState<VnpayResult | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const params = Object.fromEntries(searchParams.entries())

                const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000"
                const queryString = new URLSearchParams(params).toString()
                const res = await fetch(`${apiBase}/api/payments/vnpay/return?${queryString}`)

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}))
                    throw new Error(errData.message || errData.error || "Verification failed")
                }

                const data: VnpayResult = await res.json()
                setResult(data)
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Không thể xác thực kết quả thanh toán"
                setError(msg)
            } finally {
                setLoading(false)
            }
        }

        verifyPayment()
    }, [searchParams])

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)

    const formatPayDate = (raw: string) => {
        if (!raw || raw.length !== 14) return raw
        const y = raw.slice(0, 4)
        const mo = raw.slice(4, 6)
        const d = raw.slice(6, 8)
        const h = raw.slice(8, 10)
        const mi = raw.slice(10, 12)
        const s = raw.slice(12, 14)
        return `${d}/${mo}/${y} ${h}:${mi}:${s}`
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#5FCBC4] mx-auto mb-4" />
                    <p className="text-[#0F4C5C] font-semibold text-lg">Đang xác thực kết quả thanh toán...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-[#0F4C5C] mb-2">Lỗi xác thực</h1>
                    <p className="text-[#52525B] mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[#5FCBC4] text-white rounded-xl font-semibold hover:bg-[#0F4C5C] transition"
                    >
                        <Home className="w-5 h-5" />
                        Về trang chủ
                    </Link>
                </div>
            </div>
        )
    }

    const isSuccess = result?.code === "00"
    const isCancelled = result?.code === "24"

    return (
        <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
                {/* Icon & Title */}
                <div className="text-center mb-6">
                    {isSuccess ? (
                        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                    ) : isCancelled ? (
                        <XCircle className="w-20 h-20 text-gray-400 mx-auto mb-4" />
                    ) : (
                        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                    )}
                    <h1 className="text-2xl font-bold text-[#0F4C5C]">
                        {isSuccess
                            ? "Thanh toán thành công!"
                            : isCancelled
                            ? "Đã hủy thanh toán"
                            : "Thanh toán thất bại"}
                    </h1>
                    <p className="text-[#52525B] mt-1">
                        {isSuccess
                            ? "Chuyến đi của bạn đã được xác nhận. Chúc bạn có một chuyến đi tuyệt vời!"
                            : isCancelled
                            ? "Bạn đã hủy giao dịch. Có thể thử lại bất kỳ lúc nào."
                            : result?.message || "Giao dịch không thành công. Vui lòng thử lại."}
                    </p>
                </div>

                {/* Details */}
                {result && (
                    <div className="bg-[#F0FDFA] rounded-xl p-5 mb-6 space-y-3 text-sm">
                        {result.payment_id && (
                            <div className="flex justify-between">
                                <span className="text-[#71717A]">Mã thanh toán</span>
                                <span className="font-medium text-[#0F4C5C] font-mono text-xs">{result.payment_id}</span>
                            </div>
                        )}
                        {result.transaction_no && (
                            <div className="flex justify-between">
                                <span className="text-[#71717A]">Mã giao dịch VNPAY</span>
                                <span className="font-medium text-[#0F4C5C]">{result.transaction_no}</span>
                            </div>
                        )}
                        {result.amount_vnd > 0 && (
                            <div className="flex justify-between">
                                <span className="text-[#71717A]">Số tiền</span>
                                <span className="font-bold text-emerald-600">{formatCurrency(result.amount_vnd)}</span>
                            </div>
                        )}
                        {result.bank_code && (
                            <div className="flex justify-between">
                                <span className="text-[#71717A]">Ngân hàng</span>
                                <span className="font-medium text-[#0F4C5C]">{result.bank_code}</span>
                            </div>
                        )}
                        {result.pay_date && (
                            <div className="flex justify-between">
                                <span className="text-[#71717A]">Thời gian</span>
                                <span className="font-medium text-[#0F4C5C]">{formatPayDate(result.pay_date)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-[#E4E4E7]">
                            <span className="text-[#71717A]">Trạng thái</span>
                            <span
                                className={`font-semibold ${
                                    isSuccess ? "text-emerald-600" : isCancelled ? "text-gray-500" : "text-red-600"
                                }`}
                            >
                                {isSuccess ? "Thành công" : isCancelled ? "Đã hủy" : "Thất bại"}
                            </span>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                    <Link
                        href="/"
                        className="flex-1 py-3 px-4 rounded-xl border border-[#E4E4E7] text-[#52525B] font-semibold flex items-center justify-center gap-2 hover:bg-[#F4F4F5] transition"
                    >
                        <Home className="w-5 h-5" />
                        Trang chủ
                    </Link>
                    <Link
                        href="/history_tour"
                        className="flex-1 py-3 px-4 rounded-xl bg-[#5FCBC4] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#0F4C5C] transition"
                    >
                        <FileText className="w-5 h-5" />
                        Lịch sử đặt tour
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function VnpayReturnPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#F0FDFA] flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-[#5FCBC4]" />
                </div>
            }
        >
            <VnpayReturnContent />
        </Suspense>
    )
}

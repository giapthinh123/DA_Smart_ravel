'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    CreditCard,
    Search,
    DollarSign,
    CheckCircle2,
    Clock,
    XCircle,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    X,
    RefreshCw,
    TrendingUp,
    Banknote,
    Filter,
} from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { PaymentService, Payment } from '@/services/payment.service'

// ─── helpers ────────────────────────────────────────────────────────────────

function parseUserId(raw: string): { id?: string; email?: string; role?: string } {
    if (!raw) return {}
    try {
        const parsed = JSON.parse(raw)
        if (typeof parsed === 'object' && parsed !== null) return parsed
    } catch {
        // not JSON
    }
    return { id: raw }
}

function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—'
    try {
        return new Date(dateStr).toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    } catch {
        return dateStr
    }
}

function formatVND(amount: number | undefined): string {
    if (amount == null) return '—'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatUSD(amount: number | undefined): string {
    if (amount == null) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

const STATUS_CONFIG: Record<
    string,
    { label: string; color: string; bg: string; icon: React.ElementType }
> = {
    completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
    pending: { label: 'Pending', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Clock },
    failed: { label: 'Failed', color: 'text-red-700', bg: 'bg-red-100', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100', icon: XCircle },
    refunded: { label: 'Refunded', color: 'text-purple-700', bg: 'bg-purple-100', icon: RefreshCw },
}

const STATUS_FILTERS = ['all', 'completed', 'pending', 'failed', 'cancelled', 'refunded'] as const
type StatusFilter = (typeof STATUS_FILTERS)[number]

const PAGE_SIZE = 10

// ─── sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const cfg = STATUS_CONFIG[status] ?? {
        label: status,
        color: 'text-gray-700',
        bg: 'bg-gray-100',
        icon: AlertCircle,
    }
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
        </span>
    )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="grid grid-cols-5 gap-2 py-2 border-b border-gray-100 last:border-0">
            <dt className="col-span-2 text-sm font-medium text-gray-500">{label}</dt>
            <dd className="col-span-3 text-sm text-gray-900 break-all">{value ?? '—'}</dd>
        </div>
    )
}

// ─── detail modal ────────────────────────────────────────────────────────────

function PaymentDetailModal({ payment, onClose }: { payment: Payment; onClose: () => void }) {
    const user = parseUserId(payment.user_id)
    const amountVnd = (payment.payment_details as any)?.amount_vnd
    const orderInfo = (payment.payment_details as any)?.order_info

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Payment Detail</h3>
                            <p className="text-xs text-gray-500 font-mono">{payment.payment_id}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-6">
                    {/* Status banner */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Status</p>
                            <StatusBadge status={payment.payment_status} />
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-500 mb-1">Amount</p>
                            <p className="text-2xl font-bold text-gray-900">{formatUSD(payment.amount)}</p>
                            {amountVnd && (
                                <p className="text-sm text-gray-500">{formatVND(amountVnd)}</p>
                            )}
                        </div>
                    </div>

                    {/* Core info */}
                    <section>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Transaction Info
                        </h4>
                        <dl>
                            <DetailRow label="Payment ID" value={<span className="font-mono text-xs">{payment.payment_id}</span>} />
                            <DetailRow label="Transaction ID" value={
                                payment.transaction_id && payment.transaction_id !== '0'
                                    ? <span className="font-mono text-xs">{payment.transaction_id}</span>
                                    : <span className="text-gray-400 italic">Not assigned</span>
                            } />
                            <DetailRow label="Payment Type" value={payment.payment_type} />
                            <DetailRow label="Method" value={payment.payment_method} />
                            <DetailRow label="Gateway" value={payment.payment_gateway} />
                            <DetailRow label="Currency" value={payment.currency} />
                            <DetailRow label="Amount (USD)" value={formatUSD(payment.amount)} />
                            {amountVnd && (
                                <DetailRow label="Amount (VND)" value={formatVND(amountVnd)} />
                            )}
                        </dl>
                    </section>

                    {/* User info */}
                    <section>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            User
                        </h4>
                        <dl>
                            <DetailRow label="User ID" value={<span className="font-mono text-xs">{user.id ?? payment.user_id}</span>} />
                            {user.email && <DetailRow label="Email" value={user.email} />}
                            {user.role && <DetailRow label="Role" value={user.role} />}
                        </dl>
                    </section>

                    {/* Tour */}
                    <section>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Tour / Itinerary
                        </h4>
                        <dl>
                            <DetailRow label="Tour ID" value={<span className="font-mono text-xs break-all">{payment.tour_id}</span>} />
                            {orderInfo && <DetailRow label="Order Info" value={orderInfo} />}
                        </dl>
                    </section>

                    {/* Timestamps */}
                    <section>
                        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
                            Timestamps
                        </h4>
                        <dl>
                            <DetailRow label="Created At" value={formatDate(payment.created_at)} />
                            <DetailRow label="Updated At" value={formatDate(payment.updated_at)} />
                            <DetailRow label="Payment Time" value={formatDate(payment.payment_time)} />
                        </dl>
                    </section>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                    <p className="text-xs text-gray-500 text-center flex items-center justify-center gap-1.5">
                        <AlertCircle className="h-3.5 w-3.5" />
                        This is a read-only view. Payment records cannot be modified.
                    </p>
                </div>
            </div>
        </div>
    )
}

// ─── main page ───────────────────────────────────────────────────────────────

function PaymentManagementPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filters
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)

    // Detail modal
    const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)

    // ── fetch ──
    const fetchPayments = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await PaymentService.getAllPayments({ limit: 500 })
            setPayments(data.payments)
        } catch (err: any) {
            setError(err.message || 'Failed to load payments')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPayments()
    }, [])

    // ── derived data ──
    const filtered = useMemo(() => {
        const q = searchQuery.toLowerCase().trim()
        return payments.filter((p) => {
            const matchStatus = statusFilter === 'all' || p.payment_status === statusFilter
            if (!matchStatus) return false
            if (!q) return true
            const user = parseUserId(p.user_id)
            return (
                p.payment_id.toLowerCase().includes(q) ||
                p.tour_id.toLowerCase().includes(q) ||
                (user.email ?? '').toLowerCase().includes(q) ||
                (user.id ?? '').toLowerCase().includes(q) ||
                p.payment_method.toLowerCase().includes(q) ||
                p.payment_gateway.toLowerCase().includes(q)
            )
        })
    }, [payments, searchQuery, statusFilter])

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter])

    // ── stats ──
    const stats = useMemo(() => {
        const completed = payments.filter((p) => p.payment_status === 'completed')
        const totalRevenueUsd = completed.reduce((s, p) => s + p.amount, 0)
        const totalRevenueVnd = completed.reduce((s, p) => {
            const vnd = (p.payment_details as any)?.amount_vnd ?? 0
            return s + vnd
        }, 0)

        return {
            total: payments.length,
            completed: payments.filter((p) => p.payment_status === 'completed').length,
            pending: payments.filter((p) => p.payment_status === 'pending').length,
            failed: payments.filter((p) => p.payment_status === 'failed').length,
            cancelled: payments.filter((p) => (p.payment_status as string) === 'cancelled').length,
            totalRevenueUsd,
            totalRevenueVnd,
        }
    }, [payments])

    return (
        <>
            {/* ── stats cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white border-gray-200">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Total Payments</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <div className="p-2.5 bg-blue-100 rounded-xl">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                            <span className="text-green-600 font-medium">{stats.completed} completed</span>
                            <span className="text-yellow-600 font-medium">{stats.pending} pending</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatUSD(stats.totalRevenueUsd)}</p>
                            </div>
                            <div className="p-2.5 bg-green-100 rounded-xl">
                                <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{formatVND(stats.totalRevenueVnd)}</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Failed / Cancelled</p>
                                <p className="text-2xl font-bold text-red-600">{stats.failed + stats.cancelled}</p>
                            </div>
                            <div className="p-2.5 bg-red-100 rounded-xl">
                                <XCircle className="h-5 w-5 text-red-500" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-3 text-xs text-gray-500">
                            <span className="text-red-600 font-medium">{stats.failed} failed</span>
                            <span className="text-gray-600 font-medium">{stats.cancelled} cancelled</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardContent className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                                </p>
                            </div>
                            <div className="p-2.5 bg-cyan-100 rounded-xl">
                                <TrendingUp className="h-5 w-5 text-cyan-600" />
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">{stats.completed} of {stats.total} transactions</p>
                    </CardContent>
                </Card>
            </div>

            {/* ── table card ── */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="border-b border-gray-200 px-6 py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-blue-600" />
                            Payment Records
                        </CardTitle>
                        <button
                            onClick={fetchPayments}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by payment ID, tour ID, user email…"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
                            />
                        </div>

                        {/* Status filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-900 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                {STATUS_FILTERS.map((s) => (
                                    <option key={s} value={s}>
                                        {s === 'all' ? 'All Statuses' : (STATUS_CONFIG[s]?.label ?? s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Result count */}
                    <p className="text-sm text-gray-500 mb-4">
                        Showing {paginated.length} of {filtered.length} records
                        {statusFilter !== 'all' && ` · Status: ${STATUS_CONFIG[statusFilter]?.label}`}
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-xl mb-4 text-red-700 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">
                            <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No payments found</p>
                            <p className="text-sm mt-1">Try adjusting your search or filter</p>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto rounded-xl border border-gray-200">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Payment ID</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">User</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Tour ID</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Amount</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Method</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Status</th>
                                            <th className="text-left px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Created</th>
                                            <th className="text-center px-4 py-3 font-semibold text-gray-600 whitespace-nowrap">Detail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginated.map((payment) => {
                                            const user = parseUserId(payment.user_id)
                                            const amountVnd = (payment.payment_details as any)?.amount_vnd
                                            return (
                                                <tr key={payment.payment_id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                                            {payment.payment_id.slice(0, 18)}…
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="text-gray-900 font-medium text-xs">{user.email ?? '—'}</p>
                                                            {user.role && (
                                                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                    {user.role}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 max-w-[180px]">
                                                        <span className="font-mono text-xs text-gray-600 truncate block" title={payment.tour_id}>
                                                            {payment.tour_id.length > 24 ? payment.tour_id.slice(0, 24) + '…' : payment.tour_id}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{formatUSD(payment.amount)}</p>
                                                            {amountVnd && (
                                                                <p className="text-xs text-gray-500">{formatVND(amountVnd)}</p>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-xs text-gray-700 font-medium capitalize">{payment.payment_method}</span>
                                                            <span className="text-xs text-gray-400">{payment.payment_gateway}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={payment.payment_status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                                                        {formatDate(payment.created_at)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => setSelectedPayment(payment)}
                                                            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                                                            title="View detail"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let page = i + 1
                                            if (totalPages > 5) {
                                                if (currentPage <= 3) page = i + 1
                                                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i
                                                else page = currentPage - 2 + i
                                            }
                                            return (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                        currentPage === page
                                                            ? 'bg-blue-600 text-white'
                                                            : 'hover:bg-gray-100 text-gray-600'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            )
                                        })}
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Detail modal */}
            {selectedPayment && (
                <PaymentDetailModal
                    payment={selectedPayment}
                    onClose={() => setSelectedPayment(null)}
                />
            )}
        </>
    )
}

export default function AdminPaymentsPage() {
    return (
        <AdminLayout
            title="Payment Management"
            description="View and monitor all payment transactions. Records are read-only."
        >
            <PaymentManagementPage />
        </AdminLayout>
    )
}

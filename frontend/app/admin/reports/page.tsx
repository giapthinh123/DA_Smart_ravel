'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    DollarSign,
    Users,
    Globe,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Loader2,
    BarChart3,
    Calendar,
    ChevronDown,
    FileText,
    PieChart as PieChartIcon,
    AlertCircle,
} from 'lucide-react'
import { useEffect, useState, useMemo } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useTranslations } from 'next-intl'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ReportSummary {
    total_revenue: number
    total_payments: number
    completed_payments: number
    pending_payments: number
    failed_payments: number
    new_users: number
    tours_created: number
}

interface ChartDataPoint {
    label: string
    revenue: number
    payments: number
    users: number
    tours: number
}

interface ReportPeriod {
    type: string
    label: string
    year: number
    month?: number
    quarter?: number
}

interface ReportData {
    period: ReportPeriod
    summary: ReportSummary
    chart_data: ChartDataPoint[]
}

type ReportType = 'month' | 'quarter' | 'year'

// ─── Constants ───────────────────────────────────────────────────────────────

const MONTHS = [
    { value: 1, label: 'Jan' },
    { value: 2, label: 'Feb' },
    { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' },
    { value: 5, label: 'May' },
    { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' },
    { value: 8, label: 'Aug' },
    { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' },
    { value: 11, label: 'Nov' },
    { value: 12, label: 'Dec' },
]

const QUARTERS = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' },
]

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount)
}

function getYearOptions() {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let y = currentYear; y >= currentYear - 5; y--) {
        years.push(y)
    }
    return years
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-4">
            <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
            {payload.map((entry: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                    />
                    <span>{entry.name}:</span>
                    <span className="font-semibold text-gray-900">
                        {entry.name === 'Revenue' || entry.dataKey === 'revenue'
                            ? formatCurrency(entry.value)
                            : entry.value}
                    </span>
                </div>
            ))}
        </div>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

function AdminReportPage() {
    const { token } = useAuthStore()
    const t = useTranslations('AdminReport')

    const now = new Date()
    const [reportType, setReportType] = useState<ReportType>('month')
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
    const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil((now.getMonth() + 1) / 3))
    const [selectedYear, setSelectedYear] = useState(now.getFullYear())

    const [reportData, setReportData] = useState<ReportData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch report data
    useEffect(() => {
        const fetchReport = async () => {
            if (!token) return
            try {
                setIsLoading(true)
                setError(null)

                const params = new URLSearchParams({
                    type: reportType,
                    year: selectedYear.toString(),
                })
                if (reportType === 'month') params.set('month', selectedMonth.toString())
                if (reportType === 'quarter') params.set('quarter', selectedQuarter.toString())

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/report?${params}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                )

                if (!response.ok) throw new Error('Failed to fetch report')

                const data = await response.json()
                setReportData(data)
            } catch (err: any) {
                console.error('Error fetching report:', err)
                setError(err.message || 'Failed to load report')
            } finally {
                setIsLoading(false)
            }
        }

        fetchReport()
    }, [token, reportType, selectedMonth, selectedQuarter, selectedYear])

    // Pie chart data
    const pieData = useMemo(() => {
        if (!reportData) return []
        const { completed_payments, pending_payments, failed_payments } = reportData.summary
        return [
            { name: t('pie.completed'), value: completed_payments },
            { name: t('pie.pending'), value: pending_payments },
            { name: t('pie.failed'), value: failed_payments },
        ].filter((d) => d.value > 0)
    }, [reportData, t])

    const summary = reportData?.summary
    const chartData = reportData?.chart_data || []

    // Stats cards
    const statCards = summary
        ? [
            {
                title: t('stats.totalRevenue'),
                value: formatCurrency(summary.total_revenue),
                icon: DollarSign,
                bgColor: 'bg-green-100',
                iconColor: 'text-green-600',
                sub: `${summary.completed_payments} ${t('stats.completedPayments')}`,
            },
            {
                title: t('stats.totalPayments'),
                value: summary.total_payments.toString(),
                icon: CreditCard,
                bgColor: 'bg-blue-100',
                iconColor: 'text-blue-600',
                sub: `${summary.pending_payments} ${t('stats.pending')} · ${summary.failed_payments} ${t('stats.failed')}`,
            },
            {
                title: t('stats.newUsers'),
                value: summary.new_users.toString(),
                icon: Users,
                bgColor: 'bg-purple-100',
                iconColor: 'text-purple-600',
                sub: t('stats.registeredInPeriod'),
            },
            {
                title: t('stats.toursCreated'),
                value: summary.tours_created.toString(),
                icon: Globe,
                bgColor: 'bg-cyan-100',
                iconColor: 'text-cyan-600',
                sub: t('stats.createdInPeriod'),
            },
        ]
        : []

    return (
        <AdminLayout title={t('pageTitle')} description={t('pageDesc')}>
            {/* ── Time Period Selector ── */}
            <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Report type tabs */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                    {(['month', 'quarter', 'year'] as ReportType[]).map((type) => (
                        <button
                            key={type}
                            onClick={() => setReportType(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${reportType === type
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                                }`}
                        >
                            {t(`tabs.${type}`)}
                        </button>
                    ))}
                </div>

                {/* Period-specific selectors */}
                <div className="flex items-center gap-3">
                    {reportType === 'month' && (
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                {MONTHS.map((m) => (
                                    <option key={m.value} value={m.value}>
                                        {m.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    {reportType === 'quarter' && (
                        <div className="relative">
                            <select
                                value={selectedQuarter}
                                onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                                className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                {QUARTERS.map((q) => (
                                    <option key={q.value} value={q.value}>
                                        {q.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        </div>
                    )}

                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="appearance-none pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            {getYearOptions().map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Period label */}
                {reportData && !isLoading && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">
                            {reportData.period.label}
                        </span>
                    </div>
                )}
            </div>

            {/* ── Error State ── */}
            {error && (
                <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* ── Stats Cards ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {isLoading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="bg-white border-gray-200">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse" />
                                        <div className="h-8 bg-gray-200 rounded w-20 animate-pulse" />
                                    </div>
                                    <div className="p-3 rounded-xl bg-gray-100">
                                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                                    </div>
                                </div>
                                <div className="h-3 bg-gray-100 rounded w-32 animate-pulse" />
                            </CardContent>
                        </Card>
                    ))
                    : statCards.map((stat, i) => {
                        const Icon = stat.icon
                        return (
                            <Card
                                key={i}
                                className="bg-white border-gray-200 hover:border-gray-300 transition-all hover:shadow-md"
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">
                                                {stat.title}
                                            </p>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {stat.value}
                                            </h3>
                                        </div>
                                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">{stat.sub}</p>
                                </CardContent>
                            </Card>
                        )
                    })}
            </div>

            {/* ── Charts Row 1: Revenue Bar + Pie ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Revenue Bar Chart */}
                <Card className="lg:col-span-2 bg-white border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-blue-600" />
                            {t('charts.revenueTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                                <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                            </div>
                        ) : chartData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <BarChart3 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">{t('charts.noData')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={chartData}
                                        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis
                                            dataKey="label"
                                            stroke="#9ca3af"
                                            style={{ fontSize: '11px' }}
                                            tick={{ fill: '#6b7280' }}
                                        />
                                        <YAxis
                                            stroke="#9ca3af"
                                            style={{ fontSize: '11px' }}
                                            tick={{ fill: '#6b7280' }}
                                            tickFormatter={(v) => `$${v}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            wrapperStyle={{ paddingTop: '16px' }}
                                            iconType="rect"
                                        />
                                        <Bar
                                            dataKey="revenue"
                                            fill="#3b82f6"
                                            name={t('charts.revenue')}
                                            radius={[4, 4, 0, 0]}
                                            maxBarSize={40}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payment Status Pie Chart */}
                <Card className="bg-white border-gray-200">
                    <CardHeader className="border-b border-gray-200">
                        <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-purple-600" />
                            {t('charts.paymentStatusTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        {isLoading ? (
                            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                                <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                            </div>
                        ) : pieData.length === 0 ? (
                            <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                                <div className="text-center">
                                    <PieChartIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">{t('charts.noData')}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="h-80 flex flex-col items-center justify-center">
                                <ResponsiveContainer width="100%" height="75%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((_, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Legend */}
                                <div className="flex flex-wrap justify-center gap-4 mt-2">
                                    {pieData.map((entry, i) => (
                                        <div key={i} className="flex items-center gap-1.5 text-xs">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{
                                                    backgroundColor:
                                                        PIE_COLORS[i % PIE_COLORS.length],
                                                }}
                                            />
                                            <span className="text-gray-600">
                                                {entry.name}: {entry.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ── Charts Row 2: Users & Tours Growth ── */}
            <Card className="bg-white border-gray-200 mb-8">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                        {t('charts.growthTitle')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                            <Loader2 className="h-10 w-10 text-gray-400 animate-spin" />
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <TrendingDown className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-500 text-sm">{t('charts.noData')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="label"
                                        stroke="#9ca3af"
                                        style={{ fontSize: '11px' }}
                                        tick={{ fill: '#6b7280' }}
                                    />
                                    <YAxis
                                        stroke="#9ca3af"
                                        style={{ fontSize: '11px' }}
                                        tick={{ fill: '#6b7280' }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ paddingTop: '16px' }}
                                        iconType="line"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#8b5cf6"
                                        strokeWidth={2.5}
                                        name={t('charts.users')}
                                        dot={{ fill: '#8b5cf6', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="tours"
                                        stroke="#06b6d4"
                                        strokeWidth={2.5}
                                        name={t('charts.tours')}
                                        dot={{ fill: '#06b6d4', r: 4 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── Data Table ── */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-600" />
                        {t('table.title')}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {isLoading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
                            <p className="text-sm">{t('table.noData')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto rounded-xl border border-gray-200">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-200">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">
                                            {t('table.period')}
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                            {t('table.revenue')}
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                            {t('table.payments')}
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                            {t('table.users')}
                                        </th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">
                                            {t('table.tours')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {chartData.map((row, i) => (
                                        <tr
                                            key={i}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-4 py-3 font-medium text-gray-900">
                                                {row.label}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700 font-semibold">
                                                {formatCurrency(row.revenue)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {row.payments}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {row.users}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-700">
                                                {row.tours}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                {/* Totals row */}
                                {summary && (
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                                            <td className="px-4 py-3 font-bold text-gray-900">
                                                {t('table.total')}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {formatCurrency(summary.total_revenue)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {summary.completed_payments}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {summary.new_users}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-900">
                                                {summary.tours_created}
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    )
}

export default function AdminReportsPage() {
    return <AdminReportPage />
}

'use client'

import { AuthGuard } from '@/components/auth-guard'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Users,
  Plane,
  MapPin,
  TrendingUp,
  Calendar,
  BarChart3,
  Search,
  Bell,
  DollarSign,
  LogOut,
  Globe,
  LayoutDashboard,
  CheckCircle,
  Edit,
  User,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/i18n/language-switcher'
import { useTranslations } from 'next-intl'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface AdminStats {
  month: number
  year: number
  tours_created: number
  new_users: number
  revenue: number
  paid_tours_count: number
}

interface ChartDataPoint {
  month: string
  month_name: string
  bookings: number
  users: number
}

function AdminDashboard() {
  const { user, token } = useAuthStore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [statsData, setStatsData] = useState<AdminStats | null>(null)
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [isChartLoading, setIsChartLoading] = useState(true)
  const t = useTranslations("AdminDashboard")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchStats = async () => {
      if (!token) return

      try {
        setIsLoading(true)
        const now = new Date()
        const month = now.getMonth() + 1
        const year = now.getFullYear()

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/stats?month=${month}&year=${year}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStatsData(data)
      } catch (error) {
        console.error('Error fetching admin stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (mounted) {
      fetchStats()
    }
  }, [mounted, token])

  useEffect(() => {
    const fetchChartData = async () => {
      if (!token) return

      try {
        setIsChartLoading(true)
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/admin/growth-chart?months=6`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (!response.ok) {
          throw new Error('Failed to fetch chart data')
        }

        const result = await response.json()
        setChartData(result.data || [])
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setIsChartLoading(false)
      }
    }

    if (mounted) {
      fetchChartData()
    }
  }, [mounted, token])

  const getMonthName = (month: number) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return monthNames[month - 1] || ''
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const stats = statsData ? [
    {
      title: t("stats.toursCreated"),
      value: statsData.tours_created.toString(),
      icon: Globe,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    {
      title: t("stats.newUsers"),
      value: statsData.new_users.toString(),
      icon: Users,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    {
      title: t("stats.paidTours"),
      value: statsData.paid_tours_count.toString(),
      icon: Calendar,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      title: t("stats.revenue"),
      value: formatCurrency(statsData.revenue),
      icon: DollarSign,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
  ] : []

  if (!mounted) {
    return null
  }

  return (
        <AdminLayout title={t('pageTitle')} description={t('pageDesc')}>
          {statsData && (
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {t("stats.monthlyTitle", { 
                  month: getMonthName(statsData.month), 
                  year: statsData.year 
                })}
              </h2>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="bg-white border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-3 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-100">
                        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <Card key={index} className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                          <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                          <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          {/* Charts and Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bookings & User Growth Chart */}
            <Card className="lg:col-span-2 bg-white border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">{t("charts.growthTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isChartLoading ? (
                  <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <Loader2 className="h-12 w-12 text-gray-400 mx-auto mb-3 animate-spin" />
                      <p className="text-gray-600 font-medium">{t("charts.loading")}</p>
                    </div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium">{t("charts.noData")}</p>
                    </div>
                  </div>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="month_name" 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="#6b7280"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: '20px' }}
                          iconType="line"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name={t("charts.bookings")}
                          dot={{ fill: '#3b82f6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name={t("charts.users")}
                          dot={{ fill: '#8b5cf6', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </AdminLayout>
  )
}

// Wrap the component with AuthGuard
export default function AdminPage() {
  return (
    <AuthGuard requiredRoles={['admin']}>
      <AdminDashboard />
    </AuthGuard>
  )
}

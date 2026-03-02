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
  User
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
// Sidebar navigation items


function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Mock data - replace with real API calls
  const stats = [
    { 
      title: 'Total Tours', 
      value: '248', 
      change: '+12%', 
      icon: Globe,
      isPositive: true,
      bgColor: 'bg-cyan-100',
      iconColor: 'text-cyan-600'
    },
    { 
      title: 'Total Users', 
      value: '1,543', 
      change: '+23%', 
      icon: Users,
      isPositive: true,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600'
    },
    { 
      title: 'Total Bookings', 
      value: '892', 
      change: '+18%', 
      icon: Calendar,
      isPositive: true,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    { 
      title: 'Total Revenue', 
      value: '$45,231', 
      change: '-5%', 
      icon: DollarSign,
      isPositive: false,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
  ]

  const recentActivities = [
    { 
      action: 'Created new tour', 
      detail: 'Paris City Tour', 
      time: '2 hours ago',
      icon: CheckCircle,
      iconColor: 'text-cyan-600'
    },
    { 
      action: 'Updated tour', 
      detail: 'Bali Beach Paradise', 
      time: '4 hours ago',
      icon: Edit,
      iconColor: 'text-blue-600'
    },
    { 
      action: 'Approved booking', 
      detail: 'Booking BK001', 
      time: '6 hours ago',
      icon: CheckCircle,
      iconColor: 'text-cyan-600'
    },
    { 
      action: 'New user registered', 
      detail: 'John Doe', 
      time: '8 hours ago',
      icon: User,
      iconColor: 'text-purple-600'
    },
  ]

  if (!mounted) {
    return null
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Search Bar */}
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search tours, users, bookings..." 
                className="pl-10 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500"
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-900">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-8 bg-gray-50">
          {/* Page Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h2>
            <p className="text-gray-600">Welcome back! Here's your travel business overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
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
                    <div className="flex items-center gap-1">
                      <TrendingUp className={`h-4 w-4 ${stat.isPositive ? 'text-green-600' : 'text-red-600'} ${!stat.isPositive && 'rotate-180'}`} />
                      <span className={`text-sm font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Charts and Activity Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Bookings & User Growth Chart */}
            <Card className="lg:col-span-2 bg-white border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">Bookings & User Growth</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-80 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">Chart visualization</p>
                    <p className="text-sm text-gray-500 mt-1">Connect your analytics data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-xl font-bold text-gray-900">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-200">
                  {recentActivities.map((activity, index) => {
                    const Icon = activity.icon
                    return (
                      <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                          <div className={`mt-1 ${activity.iconColor}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                            <p className="text-xs text-gray-600 mt-1">{activity.detail}</p>
                            <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
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

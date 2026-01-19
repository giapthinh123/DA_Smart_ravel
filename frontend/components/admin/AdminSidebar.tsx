'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    Globe,
    MapPin,
    Users,
    Calendar,
    BarChart3,
    LogOut
} from 'lucide-react'

// Sidebar navigation items
const sidebarItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { name: 'Tour Management', icon: Globe, href: '/admin/tours' },
    { name: 'Location Management', icon: MapPin, href: '/admin/locations' },
    { name: 'User Management', icon: Users, href: '/admin/users' },
    { name: 'Booking Management', icon: Calendar, href: '/admin/bookings' },
    { name: 'Reports & Statistics', icon: BarChart3, href: '/admin/reports' },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { logout } = useAuthStore()

    return (
        <aside className="w-64 bg-gray-50 dark:bg-[#1e2536] border-r border-gray-200 dark:border-gray-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">TravelAdmin</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    Logout
                </Button>
            </div>
        </aside>
    )
}

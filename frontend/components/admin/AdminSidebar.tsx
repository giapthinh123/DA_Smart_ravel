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
    LogOut,
    CreditCard
} from 'lucide-react'

import { useTranslations } from 'next-intl'

// Sidebar navigation keys
const sidebarKeys = [
    { key: 'dashboard', icon: LayoutDashboard, href: '/admin' },
    { key: 'tourManagement', icon: Globe, href: '/admin/tours' },
    { key: 'locationManagement', icon: MapPin, href: '/admin/locations' },
    { key: 'userManagement', icon: Users, href: '/admin/users' },
    { key: 'paymentManagement', icon: CreditCard, href: '/admin/payments' },
    { key: 'reports', icon: BarChart3, href: '/admin/reports' },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const { logout } = useAuthStore()
    const t = useTranslations("AdminSidebar")

    return (
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                        <Globe className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">{t("brand")}</h1>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {sidebarKeys.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                        >
                            <Icon className="h-5 w-5" />
                            <span className="text-sm font-medium">{t(`menu.${item.key}`)}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <Button
                    onClick={logout}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                    <LogOut className="h-5 w-5 mr-3" />
                    {t("logout")}
                </Button>
            </div>
        </aside>
    )
}

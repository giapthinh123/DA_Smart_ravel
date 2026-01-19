'use client'

import { ReactNode, useEffect, useState } from 'react'
import { AuthGuard } from '@/components/auth-guard'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'

interface AdminLayoutProps {
    children: ReactNode
    title?: string
    description?: string
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return (
        <AuthGuard requiredRoles={['admin']}>
            <div className="flex h-screen bg-white dark:bg-slate-950 overflow-hidden">
                {/* Sidebar */}
                <AdminSidebar />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Header */}
                    <AdminHeader title={title} description={description} />

                    {/* Main Content Area */}
                    <main className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-slate-950">
                        {title && (
                            <div className="mb-8">
                                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                                    {title}
                                </h2>
                                {description && (
                                    <p className="text-gray-600 dark:text-gray-400">{description}</p>
                                )}
                            </div>
                        )}
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}

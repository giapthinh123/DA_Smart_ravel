'use client'

import { useTheme } from 'next-themes'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Search,
    Moon,
    Sun,
    User
} from 'lucide-react'

interface AdminHeaderProps {
    title?: string
    description?: string
}

export function AdminHeader({ title, description }: AdminHeaderProps) {
    const { theme, setTheme } = useTheme()
    const { user } = useAuthStore()

    return (
        <header className="bg-white dark:bg-[#242b3d] border-b border-gray-200 dark:border-gray-800 px-8 py-4">
            <div className="flex items-center justify-between">
                {/* Search Bar */}
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                    <Input
                        placeholder="Search tours, users, bookings..."
                        className="pl-10 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500"
                    />
                </div>

                {/* Right side */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                    </Button>
                    <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user?.fullname || 'Admin'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}

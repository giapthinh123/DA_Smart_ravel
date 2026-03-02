'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { User } from 'lucide-react'

export function AdminHeader() {
    const { user } = useAuthStore()

    return (
        <header className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="items-center justify-between">
                <div className="flex items-center gap-4 justify-end">
                    <div className="flex items-center gap-3 pl-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                            {user?.fullname || 'Admin'}
                        </span>
                    </div>
                </div>
            </div>
        </header>
    )
}

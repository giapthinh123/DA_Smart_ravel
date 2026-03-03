"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { AdminOnly } from "@/components/role-gate"
import { useTranslations } from "next-intl"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function UserMenu() {
    const router = useRouter()
    const { user, logout } = useAuthStore()
    const t = useTranslations("SharedHeader")

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="rounded-full border border-[#E4E4E7] bg-white px-4 py-2 text-[#3F3F46] transition hover:bg-[#CCFBF1] hover:border-[#5FCBC4] hover:text-[#0F4C5C] flex items-center gap-2 text-sm font-medium">
                    <span>{user?.role === 'admin' ? 'ADMIN' : user?.fullname || user?.email || 'USER'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white border border-[#E4E4E7] shadow-lg rounded-2xl">
                <DropdownMenuLabel className="text-[#0F4C5C]">
                    <div className="flex flex-col">
                        <span className="font-medium">{user?.fullname || 'User'}</span>
                        <span className="text-xs text-[#A1A1AA]">{user?.email}</span>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#E4E4E7]" />

                <DropdownMenuItem asChild className="text-[#3F3F46] hover:bg-[#CCFBF1] hover:text-[#0F4C5C] cursor-pointer rounded-xl mx-1">
                    <Link href="/profile" className="flex items-center w-full">
                        <svg className="w-4 h-4 mr-2 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {t("profile")}
                    </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="text-[#3F3F46] hover:bg-[#CCFBF1] hover:text-[#0F4C5C] cursor-pointer rounded-xl mx-1">
                    <Link href="/history_tour" className="flex items-center w-full">
                        <svg className="w-4 h-4 mr-2 text-[#5FCBC4]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t("historyTour")}
                    </Link>
                </DropdownMenuItem>

                <AdminOnly>
                    <DropdownMenuItem asChild className="text-[#5FCBC4] hover:bg-[#CCFBF1] cursor-pointer rounded-xl mx-1">
                        <Link href="/admin" className="flex items-center w-full">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {t("adminPanel")}
                        </Link>
                    </DropdownMenuItem>
                </AdminOnly>

                <DropdownMenuSeparator className="bg-[#E4E4E7]" />

                <DropdownMenuItem
                    onClick={async () => {
                        await logout()
                        router.push('/login')
                    }}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 cursor-pointer rounded-xl mx-1 mb-1"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t("logout")}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

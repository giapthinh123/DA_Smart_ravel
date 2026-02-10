"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function DashboardNav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/planner" className="flex items-center gap-2">
            <Globe className="h-7 w-7 text-cyan-400" />
            <span className="text-2xl font-bold text-white">SMART TRAVEL</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="#experiences" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Experiences
            </Link>
            <Link href="#featured" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Featured Tours
            </Link>
            <Link href="#stories" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              Stories
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}


            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white" asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

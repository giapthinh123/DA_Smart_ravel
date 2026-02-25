import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="h-1 w-full bg-[#5FCBC4]" />
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Globe className="h-6 w-6 text-[#5FCBC4]" />
          <span className="text-xl font-semibold text-[#1E293B]">TravelTour</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#5FCBC4]">
            Home
          </Link>
          <Link href="/tours" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#5FCBC4]">
            Tours
          </Link>
          <Link href="/planner" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#5FCBC4]">
            Dashboard
          </Link>
          <Link href="#about" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#5FCBC4]">
            About
          </Link>
          <Link href="#contact" className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#5FCBC4]">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="text-[#64748B] hover:text-[#1E293B]">
            <Link href="/login">Login</Link>
          </Button>
          <Button size="sm" asChild className="bg-[#5FCBC4] hover:bg-[#4AB8B0] text-white rounded-full">
            <Link href="/register">Register</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

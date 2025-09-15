'use client'

import { Navbar } from '../components/common/Navbar'
import { useAppStore } from '@/store/useAppStore'
import { SearchSection } from '@/components/common/SearchSection'
import { FeaturedTours } from '@/components/common/FeaturedTours'
import { Footer } from '@/components/common/Footer'

export function HeroSection() {
  const { language } = useAppStore()

  return (
    <div className="hero-content">
      <h1 className="hero-title">
        <span>{language === 'vi' ? 'Khám phá' : 'Explore'}</span>{' '}
        <span className="text-blue-400">Vietnam</span>,{' '}
        <span className="text-orange-400">
          {language === 'vi' ? 'Sống Hành Trình Của Bạn!' : 'Live Your Journey!'}
        </span>
      </h1>
      <p className="hero-subtitle">
        {language === 'vi' 
          ? 'Khám phá vẻ đẹp Việt Nam với trải nghiệm du lịch cá nhân hóa'
          : 'Discover the beauty of Vietnam with personalized travel experiences'
        }
      </p>
    </div>
  )
}

export default function HomePage() {
  return (
    <main>
      <header className="hero-header">
        <Navbar/>
        <HeroSection />
      </header>
      
      <SearchSection />
      <FeaturedTours />
      <Footer />
    </main>
  )
}
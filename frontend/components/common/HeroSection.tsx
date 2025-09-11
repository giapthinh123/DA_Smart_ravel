'use client'

import { useAppStore } from '@/store/useAppStore'

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

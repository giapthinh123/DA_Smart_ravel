import { Navbar } from '../components/common/Navbar'
import { HeroSection } from '@/components/common/HeroSection'
import { SearchSection } from '@/components/common/SearchSection'
import { FeaturedTours } from '@/components/common/FeaturedTours'
import { Footer } from '@/components/common/Footer'

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
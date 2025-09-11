'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Tour } from '@/types/domain'
import { TravelService } from '@/services/travel.service'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

export function FeaturedTours() {
  const { currency, language } = useAppStore()
  const [tours, setTours] = useState<Tour[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Default tours as fallback
  const defaultTours: Tour[] = [
    {
      id: '1',
      title: language === 'vi' ? 'Thành phố Hồ Chí Minh' : 'Ho Chi Minh City',
      location: 'Ho Chi Minh',
      duration: language === 'vi' ? '4 ngày' : '4 days',
      price: 489.25,
      currency: 'USD',
      image: ''
    },
    {
      id: '2',
      title: language === 'vi' ? 'Đà Nẵng' : 'Da Nang',
      location: 'Da Nang',
      duration: language === 'vi' ? '4 ngày' : '4 days',
      price: 525,
      currency: 'USD',
      image: ''
    },
    {
      id: '3',
      title: language === 'vi' ? 'Hà Nội' : 'Ha Noi',
      location: 'Ha Noi',
      duration: language === 'vi' ? '4 ngày' : '4 days',
      price: 443,
      currency: 'USD',
      image: ''
    },
  ]

  useEffect(() => {
    const fetchTours = async () => {
      try {
        const fetchedTours = await TravelService.getFeaturedTours()
        setTours(fetchedTours.length > 0 ? fetchedTours : defaultTours)
      } catch (error) {
        console.error('Error fetching tours:', error)
        setTours(defaultTours)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTours()
  }, [language])

  const convertPrice = (price: number, fromCurrency: string) => {
    if (currency === 'VND' && fromCurrency === 'USD') {
      return price * 24000 // Approximate exchange rate
    }
    if (currency === 'USD' && fromCurrency === 'VND') {
      return price / 24000
    }
    return price
  }

  if (isLoading) {
    return (
      <section id="tours" className="featured-tours">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
            <p className="mt-4 text-gray-500">
              {language === 'vi' ? 'Đang tải tours...' : 'Loading tours...'}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="tours" className="featured-tours">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            {language === 'vi' ? 'Tour Nổi Bật' : 'Featured Tours'}
          </h2>
          <p className="text-xl text-gray-600">
            {language === 'vi' 
              ? 'Khám phá những điểm đến phổ biến nhất tại Việt Nam'
              : 'Discover the most popular destinations in Vietnam'
            }
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {tours.map((tour) => (
            <div key={tour.id} className="tour-card">
              <img 
                src={tour.image} 
                alt={tour.title} 
                className="tour-image"
                onError={(e) => {
                  // Fallback image if original fails to load
                  e.currentTarget.src = '/'
                }}
              />
              <div className="tour-content">
                <h3 className="tour-title">{tour.title}</h3>
                <p className="tour-duration">{tour.duration}</p>
                <div className="flex justify-between items-center mt-4">
                  <span className="tour-price">
                    {language === 'vi' ? 'Từ ' : 'From '}
                    {formatCurrency(convertPrice(tour.price, tour.currency), currency)}
                  </span>
                </div>
                <Button 
                  className="btn-tour w-full"
                  variant="outline"
                  onClick={() => {
                    // Handle tour details view
                    console.log('View tour details:', tour.id)
                  }}
                >
                  {language === 'vi' ? 'Xem Chi Tiết' : 'See Details'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

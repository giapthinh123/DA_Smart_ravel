'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TravelService } from '@/services/travel.service'
import { HotelSearchParams } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { getMinDate } from '@/lib/utils'

export function HotelSearchForm() {
  const { language } = useAppStore()
  const { success, error } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<HotelSearchParams>>({
    location: '',
    checkin: '',
    checkout: '',
    guests: ''
  })

  const locationOptions = [
    { value: '', label: language === 'vi' ? 'Chọn tỉnh thành' : 'Select Province' },
    { value: 'hanoi', label: language === 'vi' ? 'Hà Nội' : 'Ha Noi' },
    { value: 'hochiminh', label: language === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh' },
    { value: 'danang', label: language === 'vi' ? 'Đà Nẵng' : 'Da Nang' },
    { value: 'phuquoc', label: language === 'vi' ? 'Phú Quốc' : 'Phu Quoc' },
    { value: 'nhatrang', label: 'Nha Trang' }
  ]

  const guestOptions = [
    { value: '1-room-2-adult', label: language === 'vi' ? '1 phòng, 2 người lớn' : '1 room, 2 adult' },
    { value: '1-room-1-adult', label: language === 'vi' ? '1 phòng, 1 người lớn' : '1 room, 1 adult' },
    { value: '2-room-4-adult', label: language === 'vi' ? '2 phòng, 4 người lớn' : '2 room, 4 adult' },
    { value: '1-room-2-adult-1-child', label: language === 'vi' ? '1 phòng, 2 người lớn, 1 trẻ em' : '1 room, 2 adult, 1 child' }
  ]

  const handleInputChange = (field: keyof HotelSearchParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.location || !formData.checkin || !formData.checkout) {
      error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 'Please fill all required fields')
      return
    }

    setIsLoading(true)

    try {
      const searchParams: HotelSearchParams = {
        location: formData.location!,
        checkin: formData.checkin!,
        checkout: formData.checkout!,
        guests: formData.guests || '1-room-2-adult'
      }

      const result = await TravelService.searchHotels(searchParams)
      success(language === 'vi' ? 'Tìm kiếm khách sạn thành công!' : 'Hotel search completed successfully!')
      console.log('Hotel search result:', result)
    } catch (err) {
      error(language === 'vi' ? 'Có lỗi xảy ra khi tìm kiếm khách sạn' : 'An error occurred during hotel search')
      console.error('Hotel search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Select
          label={language === 'vi' ? 'Vị trí *' : 'Location *'}
          value={formData.location || ''}
          onChange={handleInputChange('location')}
          options={locationOptions}
          required
        />
        
        <Input
          label={language === 'vi' ? 'Ngày nhận phòng' : 'Check In'}
          type="date"
          value={formData.checkin || ''}
          onChange={handleInputChange('checkin')}
          min={getMinDate()}
          required
        />
        
        <Input
          label={language === 'vi' ? 'Ngày trả phòng' : 'Check out'}
          type="date"
          value={formData.checkout || ''}
          onChange={handleInputChange('checkout')}
          min={formData.checkin || getMinDate()}
          required
        />
        
        <div className="flex flex-col">
          <Select
            label={language === 'vi' ? 'Số khách' : 'Number Of Guests'}
            value={formData.guests || '1-room-2-adult'}
            onChange={handleInputChange('guests')}
            options={guestOptions}
          />
          
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="mt-auto"
          >
            {language === 'vi' ? 'Tìm kiếm' : 'Search'}
          </Button>
        </div>
      </div>
    </form>
  )
}

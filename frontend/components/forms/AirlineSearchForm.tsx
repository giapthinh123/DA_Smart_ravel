'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TravelService } from '@/services/travel.service'
import { AirlineSearchParams } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { getMinDate } from '@/lib/utils'

export function AirlineSearchForm() {
  const { language } = useAppStore()
  const { success, error } = useToast()
  
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<AirlineSearchParams>>({
    departure: '',
    destination: '',
    time: '',
    date: ''
  })

  const locationOptions = [
    { value: '', label: language === 'vi' ? 'Chọn tỉnh thành' : 'Select Province' },
    { value: 'other', label: language === 'vi' ? 'Tỉnh thành khác' : 'Other province' },
    { value: 'hanoi', label: language === 'vi' ? 'Hà Nội' : 'Ha Noi' },
    { value: 'hochiminh', label: language === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh' },
    { value: 'danang', label: language === 'vi' ? 'Đà Nẵng' : 'Da Nang' },
    { value: 'phuquoc', label: language === 'vi' ? 'Phú Quốc' : 'Phu Quoc' },
    { value: 'nhatrang', label: 'Nha Trang' }
  ]

  const handleInputChange = (field: keyof AirlineSearchParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.departure || !formData.destination || !formData.date) {
      error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 'Please fill all required fields')
      return
    }

    setIsLoading(true)

    try {
      const searchParams: AirlineSearchParams = {
        departure: formData.departure!,
        destination: formData.destination!,
        time: formData.time || '',
        date: formData.date!
      }

      const result = await TravelService.searchFlights(searchParams)
      success(language === 'vi' ? 'Tìm kiếm chuyến bay thành công!' : 'Flight search completed successfully!')
      console.log('Flight search result:', result)
    } catch (err) {
      error(language === 'vi' ? 'Có lỗi xảy ra khi tìm kiếm chuyến bay' : 'An error occurred during flight search')
      console.error('Flight search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Select
          label={language === 'vi' ? 'Điểm khởi hành' : 'Departure'}
          value={formData.departure || ''}
          onChange={handleInputChange('departure')}
          options={locationOptions}
          required
        />
        
        <Select
          label={language === 'vi' ? 'Điểm đến' : 'Destination'}
          value={formData.destination || ''}
          onChange={handleInputChange('destination')}
          options={locationOptions}
          required
        />
        
        <Input
          label={language === 'vi' ? 'Giờ khởi hành' : 'Departure Time'}
          type="time"
          value={formData.time || ''}
          onChange={handleInputChange('time')}
        />
        
        <div className="flex flex-col">
          <Input
            label={language === 'vi' ? 'Ngày khởi hành' : 'Departure Day'}
            type="date"
            value={formData.date || ''}
            onChange={handleInputChange('date')}
            min={getMinDate()}
            required
          />
          
          <Button 
            type="submit" 
            isLoading={isLoading}
            className="mt-4"
          >
            {language === 'vi' ? 'Tìm kiếm' : 'Search'}
          </Button>
        </div>
      </div>
    </form>
  )
}

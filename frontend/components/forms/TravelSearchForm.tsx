'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TravelService } from '@/services/travel.service'
import { TravelSearchParams } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useToast } from '@/hooks/useToast'
import { getMinDate } from '@/lib/utils'

export function TravelSearchForm() {
  const { language } = useAppStore()
  const { success, error } = useToast()
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<TravelSearchParams>>({
    departure: '',
    destination: '',
    departureTime: '',
    departureDate: '',
    transport: undefined,
    hotel: '',
    restaurant: '',
    recreation: '',
    days: 1,
    budget: 0,
    localTransport: ''
  })

  const locationOptions = [
    { value: '', label: language === 'vi' ? 'Chọn ...' : 'Select ...' },
    { value: 'other', label: language === 'vi' ? 'Tỉnh thành khác' : 'Other province' },
    { value: 'hanoi', label: language === 'vi' ? 'Hà Nội' : 'Ha Noi' },
    { value: 'hochiminh', label: language === 'vi' ? 'Hồ Chí Minh' : 'Ho Chi Minh' },
    { value: 'danang', label: language === 'vi' ? 'Đà Nẵng' : 'Da Nang' },
    { value: 'phuquoc', label: language === 'vi' ? 'Phú Quốc' : 'Phu Quoc' },
    { value: 'nhatrang', label: 'Nha Trang' }
  ]

  const transportOptions = [
    { value: '', label: language === 'vi' ? 'Chọn phương tiện' : 'Select Means Of Transport' },
    { value: 'Plane', label: language === 'vi' ? 'Máy bay' : 'Plane' },
    { value: 'Tourist Bus', label: language === 'vi' ? 'Xe du lịch' : 'Tourist Bus' },
    { value: 'Car', label: language === 'vi' ? 'Ô tô' : 'Car' }
  ]

  const hotelOptions = [
    { value: '', label: language === 'vi' ? 'Chọn ...' : 'Select ...' },
    { value: 'hotel1', label: language === 'vi' ? 'Khách sạn 1' : 'Hotel 1' },
    { value: 'hotel2', label: language === 'vi' ? 'Khách sạn 2' : 'Hotel 2' },
    { value: 'hotel3', label: language === 'vi' ? 'Khách sạn 3' : 'Hotel 3' }
  ]

  const restaurantOptions = [
    { value: '', label: language === 'vi' ? 'Chọn ...' : 'Select ...' },
    { value: 'restaurant1', label: language === 'vi' ? 'Nhà hàng 1' : 'Restaurant 1' },
    { value: 'restaurant2', label: language === 'vi' ? 'Nhà hàng 2' : 'Restaurant 2' },
    { value: 'restaurant3', label: language === 'vi' ? 'Nhà hàng 3' : 'Restaurant 3' }
  ]

  const recreationOptions = [
    { value: '', label: language === 'vi' ? 'Chọn ...' : 'Select ...' },
    { value: 'beach', label: language === 'vi' ? 'Bãi biển' : 'Beach' },
    { value: 'museum', label: language === 'vi' ? 'Bảo tàng' : 'Museum' },
    { value: 'park', label: language === 'vi' ? 'Công viên' : 'Park' },
    { value: 'shopping', label: language === 'vi' ? 'Trung tâm mua sắm' : 'Shopping Mall' }
  ]

  const localTransportOptions = [
    { value: '', label: language === 'vi' ? 'Chọn loại xe' : 'Select Vehicle Type' },
    { value: 'Motorbike', label: language === 'vi' ? 'Xe máy' : 'Motorbike' },
    { value: 'Taxi', label: 'Taxi' },
    { value: 'Bus', label: language === 'vi' ? 'Xe buýt' : 'Bus' },
    { value: 'Bicycle', label: language === 'vi' ? 'Xe đạp' : 'Bicycle' }
  ]

  const handleInputChange = (field: keyof TravelSearchParams) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const isStep1Valid = () => {
    return formData.departure && 
           formData.destination && 
           formData.departureTime && 
           formData.departureDate && 
           formData.transport
  }

  const handleContinue = () => {
    if (isStep1Valid()) {
      setStep(2)
    }
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.days || !formData.budget) {
      error(language === 'vi' ? 'Vui lòng điền đầy đủ thông tin bắt buộc' : 'Please fill all required fields')
      return
    }

    setIsLoading(true)

    try {
      const searchParams: TravelSearchParams = {
        departure: formData.departure!,
        destination: formData.destination!,
        departureTime: formData.departureTime!,
        departureDate: formData.departureDate!,
        transport: formData.transport!,
        hotel: formData.hotel,
        restaurant: formData.restaurant,
        recreation: formData.recreation,
        days: formData.days!,
        budget: formData.budget!,
        localTransport: formData.localTransport
      }

      const result = await TravelService.searchTravel(searchParams)
      success(language === 'vi' ? 'Tìm kiếm thành công!' : 'Search completed successfully!')
      console.log('Search result:', result)
    } catch (err) {
      error(language === 'vi' ? 'Có lỗi xảy ra khi tìm kiếm' : 'An error occurred during search')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="travel-form-container">
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={language === 'vi' ? 'Giờ khởi hành *' : 'Departure time *'}
              type="time"
              value={formData.departureTime || ''}
              onChange={handleInputChange('departureTime')}
              required
            />
            <Input
              label={language === 'vi' ? 'Ngày khởi hành *' : 'Departure date *'}
              type="date"
              value={formData.departureDate || ''}
              onChange={handleInputChange('departureDate')}
              min={getMinDate()}
              required
            />
          </div>

          <Select
            label={language === 'vi' ? 'Phương tiện di chuyển *' : 'Means Of Transport *'}
            value={formData.transport || ''}
            onChange={handleInputChange('transport')}
            options={transportOptions}
            required
          />

          <div className="flex justify-end mt-6">
            <Button 
              onClick={handleContinue}
              disabled={!isStep1Valid()}
            >
              {language === 'vi' ? 'Tiếp tục' : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <form onSubmit={handleSubmit}>
          <div className="trip-info-section">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              {language === 'vi' ? 'Thông tin chuyến đi tại điểm đến' : 'Trip Information at Destination'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label={language === 'vi' ? 'Khách sạn' : 'Hotel'}
                value={formData.hotel || ''}
                onChange={handleInputChange('hotel')}
                options={hotelOptions}
              />
              <Select
                label={language === 'vi' ? 'Nhà hàng' : 'Restaurant'}
                value={formData.restaurant || ''}
                onChange={handleInputChange('restaurant')}
                options={restaurantOptions}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Select
                label={language === 'vi' ? 'Địa điểm giải trí' : 'Recreation Places'}
                value={formData.recreation || ''}
                onChange={handleInputChange('recreation')}
                options={recreationOptions}
              />
              <Input
                label={language === 'vi' ? 'Số ngày *' : 'Number of Days *'}
                type="number"
                min="1"
                value={formData.days || ''}
                onChange={handleInputChange('days')}
                placeholder="3"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label={language === 'vi' ? 'Ngân sách (USD) *' : 'Budget (USD) *'}
                type="number"
                min="0"
                value={formData.budget || ''}
                onChange={handleInputChange('budget')}
                placeholder="500"
                required
              />
            </div>

            <div className="mb-6">
              <Select
                label={language === 'vi' ? 'Phương tiện giao thông địa phương' : 'Local Means Of Transportation'}
                value={formData.localTransport || ''}
                onChange={handleInputChange('localTransport')}
                options={localTransportOptions}
              />
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handleBack}>
                {language === 'vi' ? 'Quay lại' : 'Back'}
              </Button>
              <Button type="submit" isLoading={isLoading}>
                {language === 'vi' ? 'Tìm kiếm' : 'Search'}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { RegisterData } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, isLoading, error, clearError } = useAuthStore()
  const { language } = useAppStore()
  
  const [formData, setFormData] = useState<RegisterData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    birthYear: undefined
  })

  const genderOptions = [
    { value: '', label: language === 'vi' ? 'Chọn giới tính' : 'Select Gender' },
    { value: 'Male', label: language === 'vi' ? 'Nam' : 'Male' },
    { value: 'Female', label: language === 'vi' ? 'Nữ' : 'Female' },
    { value: 'Other', label: language === 'vi' ? 'Khác' : 'Other' }
  ]

  const handleInputChange = (field: keyof RegisterData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === 'birthYear' && e.target.value ? parseInt(e.target.value) : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await register(formData)
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {language === 'vi' ? 'Đăng ký' : 'Sign Up'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={language === 'vi' ? 'Họ và tên *' : 'Full Name *'}
            type="text"
            value={formData.name}
            onChange={handleInputChange('name')}
            required
          />
          
          <Input
            label={language === 'vi' ? 'Email *' : 'Email *'}
            type="email"
            value={formData.email}
            onChange={handleInputChange('email')}
            required
          />
          
          <Input
            label={language === 'vi' ? 'Mật khẩu *' : 'Password *'}
            type="password"
            value={formData.password}
            onChange={handleInputChange('password')}
            required
          />
          
          <Input
            label={language === 'vi' ? 'Số điện thoại' : 'Phone Number'}
            type="tel"
            value={formData.phone || ''}
            onChange={handleInputChange('phone')}
          />
          
          <Select
            label={language === 'vi' ? 'Giới tính' : 'Gender'}
            value={formData.gender || ''}
            onChange={handleInputChange('gender')}
            options={genderOptions}
          />
          
          <Input
            label={language === 'vi' ? 'Năm sinh' : 'Birth Year'}
            type="number"
            min="1900"
            max="2006"
            value={formData.birthYear?.toString() || ''}
            onChange={handleInputChange('birthYear')}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          isLoading={isLoading}
          variant="secondary"
        >
          {language === 'vi' ? 'Đăng ký' : 'Sign Up'}
        </Button>
      </form>
      
      {onSwitchToLogin && (
        <div className="mt-4 text-center">
          <span className="text-gray-600">
            {language === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?'}
          </span>
          <button 
            onClick={onSwitchToLogin}
            className="text-blue-600 hover:text-blue-800 font-semibold ml-1 transition-colors"
          >
            {language === 'vi' ? 'Đăng nhập ngay' : 'Sign in now'}
          </button>
        </div>
      )}
    </div>
  )
}

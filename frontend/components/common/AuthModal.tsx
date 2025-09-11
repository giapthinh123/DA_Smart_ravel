'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { Modal, ModalHeader, ModalBody } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { LoginCredentials, RegisterData } from '@/types/domain'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const { language } = useAppStore()
  
  const [formData, setFormData] = useState({
    // Login fields
    email: '',
    password: '',
    // Register fields
    name: '',
    phone: '',
    gender: '',
    birthYear: '',
  })

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (mode === 'login') {
        const credentials: LoginCredentials = {
          email: formData.email,
          password: formData.password,
        }
        await login(credentials)
      } else {
        const userData: RegisterData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          gender: formData.gender || undefined,
          birthYear: formData.birthYear ? parseInt(formData.birthYear) : undefined,
        }
        await register(userData)
      }
      
      // Reset form and close modal on success
      setFormData({
        email: '',
        password: '',
        name: '',
        phone: '',
        gender: '',
        birthYear: '',
      })
      onClose()
    } catch (error) {
      // Error is handled by the store
      console.error('Auth error:', error)
    }
  }

  const genderOptions = [
    { value: '', label: language === 'vi' ? 'Chọn giới tính' : 'Select Gender' },
    { value: 'Male', label: language === 'vi' ? 'Nam' : 'Male' },
    { value: 'Female', label: language === 'vi' ? 'Nữ' : 'Female' },
    { value: 'Other', label: language === 'vi' ? 'Khác' : 'Other' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={mode === 'register' ? 'lg' : 'md'}>
      <ModalHeader onClose={onClose}>
        <h2 className="text-2xl font-bold text-gray-800">
          {mode === 'login' 
            ? (language === 'vi' ? 'Đăng nhập' : 'Sign In')
            : (language === 'vi' ? 'Đăng ký' : 'Sign Up')
          }
        </h2>
      </ModalHeader>
      
      <ModalBody>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <span>{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
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
                value={formData.phone}
                onChange={handleInputChange('phone')}
              />
              <Select
                label={language === 'vi' ? 'Giới tính' : 'Gender'}
                value={formData.gender}
                onChange={handleInputChange('gender')}
                options={genderOptions}
              />
              <Input
                label={language === 'vi' ? 'Năm sinh' : 'Birth Year'}
                type="number"
                min="1900"
                max="2006"
                value={formData.birthYear}
                onChange={handleInputChange('birthYear')}
              />
            </div>
          )}
          
          {mode === 'login' && (
            <div className="space-y-4">
              <Input
                label={language === 'vi' ? 'Email' : 'Email'}
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
              />
              <Input
                label={language === 'vi' ? 'Mật khẩu' : 'Password'}
                type="password"
                value={formData.password}
                onChange={handleInputChange('password')}
                required
              />
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full mt-6"
            isLoading={isLoading}
            variant={mode === 'login' ? 'primary' : 'secondary'}
          >
            {mode === 'login' 
              ? (language === 'vi' ? 'Đăng nhập' : 'Sign In')
              : (language === 'vi' ? 'Đăng ký' : 'Sign Up')
            }
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <span className="text-gray-600">
            {mode === 'login' 
              ? (language === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account?")
              : (language === 'vi' ? 'Đã có tài khoản?' : 'Already have an account?')
            }
          </span>
          <button 
            onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
            className="text-blue-600 hover:text-blue-800 font-semibold ml-1 transition-colors"
          >
            {mode === 'login' 
              ? (language === 'vi' ? 'Đăng ký ngay' : 'Sign up now')
              : (language === 'vi' ? 'Đăng nhập ngay' : 'Sign in now')
            }
          </button>
        </div>
      </ModalBody>
    </Modal>
  )
}

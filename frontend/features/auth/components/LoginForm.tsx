'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { LoginCredentials } from '@/types/domain'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading, error, clearError } = useAuthStore()
  const { language } = useAppStore()
  
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: ''
  })

  const handleInputChange = (field: keyof LoginCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (error) clearError()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await login(formData)
      onSuccess?.()
    } catch (error) {
      // Error is handled by the store
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
      </h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <span>{error}</span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
        
        <Button 
          type="submit" 
          className="w-full"
          isLoading={isLoading}
        >
          {language === 'vi' ? 'Đăng nhập' : 'Sign In'}
        </Button>
      </form>
      
      {onSwitchToRegister && (
        <div className="mt-4 text-center">
          <span className="text-gray-600">
            {language === 'vi' ? 'Chưa có tài khoản?' : "Don't have an account?"}
          </span>
          <button 
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-800 font-semibold ml-1 transition-colors"
          >
            {language === 'vi' ? 'Đăng ký ngay' : 'Sign up now'}
          </button>
        </div>
      )}
    </div>
  )
}

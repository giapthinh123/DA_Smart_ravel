'use client'

import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Currency, Language } from '@/types/domain'
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface CurrencyLanguageModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CurrencyLanguageModal({ isOpen, onClose }: CurrencyLanguageModalProps) {
  const { currency, language, updateCurrencyAndLanguage } = useAppStore()
  
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)

  const handleConfirm = () => {
    updateCurrencyAndLanguage(selectedCurrency, selectedLanguage)
    onClose()
  }

  const currencyOptions = [
    { value: 'VND' as Currency, label: 'VND', subtitle: language === 'vi' ? 'Đồng Việt Nam' : 'Vietnam Dong' },
    { value: 'USD' as Currency, label: 'USD', subtitle: language === 'vi' ? 'Đô la Mỹ' : 'US Dollar' },
  ]

  const languageOptions = [
    { value: 'vi' as Language, label: language === 'vi' ? 'Tiếng Việt (Việt Nam)' : 'Vietnamese (Vietnam)', flag: '🇻🇳' },
    { value: 'en' as Language, label: language === 'vi' ? 'Tiếng Anh (Quốc tế)' : 'English (International)', flag: '🌐' },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader onClose={onClose}>
        <h2 className="text-xl font-semibold">
          {language === 'vi' ? 'Cài đặt' : 'Settings'}
        </h2>
      </ModalHeader>
      
      <ModalBody className="space-y-6">
        {/* Currency Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">
            {language === 'vi' ? 'Đơn vị tiền tệ' : 'Currency unit'}
          </h3>
          <div className="space-y-3">
            {currencyOptions.map((option) => (
              <label key={option.value} className="option-item">
                <input
                  type="radio"
                  name="currency"
                  value={option.value}
                  checked={selectedCurrency === option.value}
                  onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                  className="option-radio"
                />
                <span className="option-content">
                  <div>
                    <div className="option-text font-medium">{option.label}</div>
                    <div className="option-subtitle text-sm text-gray-600">{option.subtitle}</div>
                  </div>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Language Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">
            {language === 'vi' ? 'Ngôn ngữ' : 'Language'}
          </h3>
          <div className="space-y-3">
            {languageOptions.map((option) => (
              <label key={option.value} className="option-item">
                <input
                  type="radio"
                  name="language"
                  value={option.value}
                  checked={selectedLanguage === option.value}
                  onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                  className="option-radio"
                />
                <span className="option-content">
                  <span className="flag-icon text-xl mr-3">{option.flag}</span>
                  <span className="option-text font-medium">{option.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      </ModalBody>
      
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          {language === 'vi' ? 'Hủy' : 'Cancel'}
        </Button>
        <Button onClick={handleConfirm}>
          {language === 'vi' ? 'Xác nhận' : 'Confirm'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

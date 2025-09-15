'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { TravelService } from '@/services/travel.service'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useToast } from '@/hooks/useToast'

export function Footer() {
  const { language } = useAppStore()
  const { success, error } = useToast()
  
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      error(language === 'vi' ? 'Vui lòng nhập email' : 'Please enter your email')
      return
    }

    setIsSubscribing(true)

    try {
      await TravelService.subscribeNewsletter(email)
      success(language === 'vi' ? 'Đăng ký thành công!' : 'Successfully subscribed!')
      setEmail('')
    } catch (err) {
      error(language === 'vi' ? 'Có lỗi xảy ra khi đăng ký' : 'An error occurred during subscription')
      console.error('Newsletter subscription error:', err)
    } finally {
      setIsSubscribing(false)
    }
  }

  const getTimezoneDisplay = (timezone: string) => {
    const timezoneMap: Record<string, string> = {
      'Asia/Ho_Chi_Minh': '(GMT+7)',
      'Asia/Bangkok': '(GMT+7)',
      'America/New_York': '(GMT-4)',
      'Europe/London': '(GMT+1)',
      'Europe/Paris': '(GMT+2)'
    }
    
    return `${timezone} ${timezoneMap[timezone] || ''}`
  }

  return (
    <footer id="contact" className="footer">
      <div className="container mx-auto px-4">
        <div className="footer-content">
          {/* Contact */}
          <div className="footer-section">
            <h3>{language === 'vi' ? 'Liên Hệ' : 'Contact'}</h3>
            <p>
              {language === 'vi'
                ? 'Tòa nhà E3, 144 Xuân Thủy, Cầu Giấy, Hà Nội, Việt Nam.'
                : 'E3 Building, 144 Xuan Thuy Street, Cau Giay District, Ha Noi, Vietnam.'
              }
            </p>
            <p>hi@travelrecommender.com</p>
          </div>
          
          {/* Company */}
          <div className="footer-section">
            <h3>{language === 'vi' ? 'Công Ty' : 'Company'}</h3>
            <a href="#">
              {language === 'vi' ? 'Về Chúng Tôi' : 'About Us'}
            </a>
            <br />
            <a href="#">
              {language === 'vi' ? 'Liên Hệ' : 'Contact Us'}
            </a>
          </div>
          
          {/* Support */}
          <div className="footer-section">
            <h3>{language === 'vi' ? 'Hỗ Trợ' : 'Support'}</h3>
            <a href="#">
              {language === 'vi' ? 'Liên Lạc' : 'Get in Touch'}
            </a>
            <br />
            <a href="#">
              {language === 'vi' ? 'Trung tâm trợ giúp' : 'Help center'}
            </a>
          </div>
          
          {/* Newsletter */}
          <div className="footer-section">
            <h3>{language === 'vi' ? 'Bản Tin' : 'Newsletter'}</h3>
            <p>
              {language === 'vi'
                ? 'Đăng ký nhận bản tin miễn phí và cập nhật thông tin'
                : 'Subscribe to the free newsletter and stay up to date'
              }
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form mt-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === 'vi' ? 'Địa chỉ email của bạn' : 'Your email address'}
                className="newsletter-input flex-1"
              />
              <Button 
                type="submit" 
                isLoading={isSubscribing}
                className="newsletter-btn"
                size="sm"
              >
                {language === 'vi' ? 'Gửi' : 'Send'}
              </Button>
            </form>
            
            <div className="mt-4">
              <h4 className="text-white mb-2">
                {language === 'vi' ? 'Theo Dõi Chúng Tôi' : 'Follow Us'}
              </h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-facebook-f"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-instagram"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <i className="fab fa-youtube"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p>
              {language === 'vi'
                ? '© 2025 Travel Recommender. Bảo lưu mọi quyền.'
                : '© 2025 Travel Recommender. All right reserved.'
              }
            </p>
            
          </div>
        </div>
      </div>
    </footer>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { useAppStore } from '@/store/useAppStore'
import { CurrencyLanguageModal } from './CurrencyLanguageModal'
import { AuthModal } from './AuthModal'

export function Navbar() {
  const router = useRouter()
  const { isAuthenticated, user, logout } = useAuthStore()
  const { currency, language } = useAppStore()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(false)
  const [showCurrencyModal, setShowCurrencyModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [showAuthDropdown, setShowAuthDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Check admin status when authentication state changes
  useEffect(() => {
    const checkAdminStatus = async () => {
      // Only check admin if user is authenticated
      if (!isAuthenticated || !user) {
        setIsAdmin(false)
        setIsCheckingAdmin(false)
        return
      }

      setIsCheckingAdmin(true)
      try {
        // Call backend directly to avoid Next.js rewrite loop
        const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        const res = await fetch(`${apiUrl}/api/check-admin`, { 
          credentials: "include",
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
            // Add auth token if available
            ...(user && 'Authorization' in localStorage && {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            })
          }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Admin check result:', data);
        
        // More explicit admin check
        setIsAdmin(data?.is_admin === true);
        
      } catch (e) {
        console.error('Admin check failed:', e);
        setIsAdmin(false);
      } finally {
        setIsCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isAuthenticated, user]) // Re-run when auth state changes
  const handleAuthClick = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setShowAuthModal(true)
    setShowAuthDropdown(false)
  }

  const handleLogout = async () => {
    await logout()
    setShowAuthDropdown(false)
  }

  return (
    <>
      <nav className="navbar py-4 px-6" style={{backgroundColor: 'rgba(255, 255, 255)' }}>
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600">
              {language === 'vi' ? 'Việt Nam - Du Lịch Cá Nhân' : 'Vietnam - Personalized Travel'}
            </h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="font-medium text-gray-700 hover:text-blue-600 transition duration-300">
              {language === 'vi' ? 'Trang chủ' : 'Home'}
            </a>
            <a href="#tours" className="font-medium text-gray-700 hover:text-blue-600 transition duration-300">
              {language === 'vi' ? 'Tour' : 'Tours'}
            </a>
            
            {/* Currency & Language Toggle */}
            <button 
              onClick={() => setShowCurrencyModal(true)}
              className="currency-language-btn hover:bg-blue-100"
              style={{backgroundColor: '#d7e5fc',borderColor: '#508ff6'}}
            >
              <i className="fas fa-globe"></i>
              <span>{currency}</span>
              <span>|</span>
              <span>{language.toUpperCase()}</span>
              <i className="fas fa-chevron-down text-xs"></i>
            </button>
            
            <a href="#contact" className="font-medium text-gray-700 hover:text-blue-600 transition duration-300">
              {language === 'vi' ? 'Liên hệ' : 'Contact'}
            </a>
            
            {/* Auth Section */}
            {isAuthenticated ? (
              <div className="auth-dropdown">
                <button 
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="font-medium text-gray-700 hover:text-blue-600 transition duration-300 flex items-center">
                  <span>{user?.name}</span>
                  <i className="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div className={`auth-dropdown-content ${showAuthDropdown ? 'active' : ''}`}>
                  <a href="/profile">
                    {language === 'vi' ? 'Hồ sơ' : 'Profile'}
                  </a>
                  <button onClick={handleLogout} className="w-full text-left p-2 hover:bg-gray-200 rounded-md">
                    {language === 'vi' ? 'Đăng xuất' : 'Logout'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="auth-dropdown">
                <button 
                  onClick={() => setShowAuthDropdown(!showAuthDropdown)}
                  className="font-medium text-gray-700 hover:text-blue-600 transition duration-300 flex items-center"
                >
                  <span>{language === 'vi' ? 'Đăng ký' : 'Sign up'}</span>
                  <i className="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div className={`auth-dropdown-content ${showAuthDropdown ? 'active' : ''}` }>
                  <button 
                    onClick={() => handleAuthClick('register')}
                    className="w-full text-left p-2 hover:bg-gray-200 rounded-md"
                    style={{height: "50px"}}
                  >
                    {language === 'vi' ? 'Đăng ký' : 'Sign up'}
                  </button>
                  <button 
                    onClick={() => handleAuthClick('login')}
                    className="w-full text-left p-2 hover:bg-gray-200 rounded-md"
                    style={{height: "50px"}}
                  >
                    {language === 'vi' ? 'Đăng nhập' : 'Log in'}
                  </button>
                </div>
              </div>
            )}
            {/* Admin Panel Button - only show when confirmed admin */}
            {isAuthenticated && !isCheckingAdmin && isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="bg-purple-500 text-white px-4 py-2 rounded-xl hover:bg-purple-600 duration-300 shadow-sm flex items-center space-x-2"
                title={language === 'vi' ? 'Truy cập bảng điều khiển admin' : 'Access admin dashboard'}
              >
                <i className="fas fa-cogs"></i>
                <span className="hidden lg:inline">
                  {language === 'vi' ? 'Admin' : 'Admin'}
                </span>
              </button>
            )}
            
            {/* Loading indicator for admin check */}
            {isAuthenticated && isCheckingAdmin && (
              <div className="bg-gray-300 text-gray-600 px-4 py-2 rounded-xl flex items-center space-x-2 animate-pulse">
                <i className="fas fa-spinner fa-spin"></i>
                <span className="hidden lg:inline text-sm">
                  {language === 'vi' ? 'Kiểm tra...' : 'Checking...'}
                </span>
              </div>
            )}
          </div>

          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <CurrencyLanguageModal 
        isOpen={showCurrencyModal}
        onClose={() => setShowCurrencyModal(false)}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </>
  )
}

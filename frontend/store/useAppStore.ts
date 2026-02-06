'use client'

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Currency, Language, SiteConfig } from '@/types/domain'

interface AppState {
  currency: Currency
  language: Language
  siteConfig: SiteConfig | null
  isLoading: boolean
}

interface AppActions {
  setCurrency: (currency: Currency) => void
  setLanguage: (language: Language) => void
  setSiteConfig: (config: SiteConfig) => void
  setLoading: (loading: boolean) => void
  updateCurrencyAndLanguage: (currency: Currency, language: Language) => void
}

type AppStore = AppState & AppActions

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set) => ({
        // State
        currency: 'USD',
        language: 'en',
        siteConfig: null,
        isLoading: false,

        // Actions
        setCurrency: (currency: Currency) => set({ currency }),
        
        setLanguage: (language: Language) => set({ language }),
        
        setSiteConfig: (config: SiteConfig) => set({ siteConfig: config }),
        
        setLoading: (loading: boolean) => set({ isLoading: loading }),
        
        updateCurrencyAndLanguage: (currency: Currency, language: Language) => 
          set({ currency, language }),
      }),
      {
        name: 'app-store',
        partialize: (state) => ({
          currency: state.currency,
          language: state.language,
        }),
      }
    ),
    {
      name: 'app-store',
    }
  )
)

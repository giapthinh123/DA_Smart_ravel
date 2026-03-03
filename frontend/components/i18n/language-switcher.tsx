'use client'

// Language switcher: đặt cookie NEXT_LOCALE rồi refresh trang
// Với localePrefix: 'never', middleware đọc cookie này để chọn ngôn ngữ
// URL không thay đổi — chỉ nội dung được render lại theo ngôn ngữ mới

import { useLocale, useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function LanguageSwitcher() {
    const t = useTranslations('Header')
    const locale = useLocale()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const switchLocale = () => {
        const nextLocale = locale === 'vi' ? 'en' : 'vi'

        // Đặt cookie NEXT_LOCALE — next-intl middleware sẽ đọc cookie này
        document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`

        startTransition(() => {
            // Refresh để server re-render với ngôn ngữ mới từ cookie
            router.refresh()
        })
    }

    return (
        <button
            onClick={switchLocale}
            disabled={isPending}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.4rem 0.75rem',
                background: 'transparent',
                border: '1px solid #E4E4E7',
                borderRadius: '6px',
                cursor: isPending ? 'wait' : 'pointer',
                opacity: isPending ? 0.7 : 1,
                fontSize: '0.875rem',
                fontWeight: 500,
                color: '#3F3F46',
                transition: 'border-color 0.2s, background 0.2s',
            }}
            aria-label={`Switch to ${locale === 'vi' ? 'English' : 'Tiếng Việt'}`}
        >
            <span>{locale === 'vi' ? '🇺🇸' : '🇻🇳'}</span>
            <span>{t('switchLanguage')}</span>
        </button>
    )
}

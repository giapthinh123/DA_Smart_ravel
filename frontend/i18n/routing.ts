import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
    locales: ['vi', 'en'],
    defaultLocale: 'vi',

    // 'never' = không thêm prefix vào URL
    // Locale được detect qua cookie NEXT_LOCALE rồi mới fallback Accept-Language
    // URL luôn là /tours, /login, /profile — không bao giờ /en/tours
    localePrefix: 'never',
})

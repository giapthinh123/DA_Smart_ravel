import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

// Cấu hình i18n không dùng middleware (middleware-free approach)
// Locale được đọc từ cookie NEXT_LOCALE
export default getRequestConfig(async () => {
    const cookieStore = await cookies()
    const localeCookie = cookieStore.get('NEXT_LOCALE')?.value
    const locale = localeCookie === 'en' ? 'en' : 'vi'

    return {
        locale,
        messages: (await import(`../messages/${locale}.json`)).default,
    }
})

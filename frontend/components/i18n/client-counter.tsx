'use client'

// =====================================================================
// CLIENT COMPONENT — sử dụng useTranslations (hoạt động ở client side)
// =====================================================================
// Cần có 'use client' directive để dùng hooks
// Messages được inject từ NextIntlClientProvider trong layout.tsx
// Không cần fetch thêm — messages đã được truyền xuống từ server layout

import { useTranslations } from 'next-intl'

export function ClientCounter() {
    // Lấy namespace 'Common' từ messages
    const t = useTranslations('Common')

    return (
        <div
            style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid #ccc',
                borderRadius: '8px',
            }}
        >
            <h3>Client Component Example</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                    onClick={() => alert(t('confirm'))}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    {t('confirm')}
                </button>
                <button
                    onClick={() => alert(t('cancel'))}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#e5e7eb',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    {t('cancel')}
                </button>
            </div>
        </div>
    )
}

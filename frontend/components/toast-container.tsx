'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast, type ToastItem } from '@/lib/toast'

/* ─── icons ──────────────────────────────────────────────────────── */
function IconSuccess() {
    return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
        </svg>
    )
}
function IconError() {
    return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} /><line x1={12} y1={8} x2={12} y2={12} /><line x1={12} y1={16} x2={12.01} y2={16} />
        </svg>
    )
}
function IconWarning() {
    return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1={12} y1={9} x2={12} y2={13} /><line x1={12} y1={17} x2={12.01} y2={17} />
        </svg>
    )
}
function IconInfo() {
    return (
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={12} cy={12} r={10} /><line x1={12} y1={16} x2={12} y2={12} /><line x1={12} y1={8} x2={12.01} y2={8} />
        </svg>
    )
}
function IconClose() {
    return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
            <line x1={18} y1={6} x2={6} y2={18} /><line x1={6} y1={6} x2={18} y2={18} />
        </svg>
    )
}

/* ─── variant config ─────────────────────────────────────────────── */
const VARIANTS = {
    success: {
        icon: <IconSuccess />,
        bar: 'bg-[#5FCBC4]',
        iconBg: 'bg-[#CCFBF1] text-[#0F4C5C]',
        title: 'text-[#0F4C5C]',
        msg: 'text-[#3F3F46]',
    },
    error: {
        icon: <IconError />,
        bar: 'bg-red-500',
        iconBg: 'bg-red-50 text-red-600',
        title: 'text-red-700',
        msg: 'text-[#3F3F46]',
    },
    warning: {
        icon: <IconWarning />,
        bar: 'bg-amber-400',
        iconBg: 'bg-amber-50 text-amber-600',
        title: 'text-amber-700',
        msg: 'text-[#3F3F46]',
    },
    info: {
        icon: <IconInfo />,
        bar: 'bg-blue-500',
        iconBg: 'bg-blue-50 text-blue-600',
        title: 'text-blue-700',
        msg: 'text-[#3F3F46]',
    },
} as const

/* ─── single toast card ──────────────────────────────────────────── */
function ToastCard({ item }: { item: ToastItem }) {
    const [visible, setVisible] = useState(false)
    const [leaving, setLeaving] = useState(false)
    const v = VARIANTS[item.type]

    useEffect(() => {
        // Trigger enter animation
        const t = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(t)
    }, [])

    const dismiss = useCallback(() => {
        setLeaving(true)
        setTimeout(() => toast.remove(item.id), 350)
    }, [item.id])

    return (
        <div
            style={{ transition: 'all 0.35s cubic-bezier(0.34, 1.3, 0.64, 1)' }}
            className={[
                'relative w-80 rounded-2xl bg-white/95 backdrop-blur shadow-2xl shadow-black/10',
                'border border-[#E4E4E7] overflow-hidden',
                'flex flex-col',
                visible && !leaving
                    ? 'translate-x-0 opacity-100'
                    : 'translate-x-6 opacity-0',
            ].join(' ')}
            role="alert"
        >
            {/* colored top bar */}
            <div className={`h-1 w-full ${v.bar} rounded-t-2xl`} />

            {/* content row */}
            <div className="flex items-start gap-3 px-4 py-4 pr-10">
                {/* icon */}
                <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${v.iconBg}`}>
                    {v.icon}
                </span>

                {/* text */}
                <div className="min-w-0 flex-1 pt-0.5">
                    {item.title && (
                        <p className={`text-sm font-semibold leading-tight mb-0.5 ${v.title}`}>
                            {item.title}
                        </p>
                    )}
                    <p className={`text-sm leading-snug ${v.msg}`}>{item.message}</p>
                </div>
            </div>

            {/* close button */}
            <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-lg text-[#A1A1AA] transition hover:bg-[#F4F4F5] hover:text-[#3F3F46]"
            >
                <IconClose />
            </button>

            {/* progress bar */}
            <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[#E4E4E7]">
                <div
                    className={`h-full ${v.bar} opacity-50`}
                    style={{
                        animation: `shrink ${item.duration}ms linear forwards`,
                    }}
                />
            </div>

            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
        </div>
    )
}

/* ─── container ──────────────────────────────────────────────────── */
export function ToastContainer() {
    const [items, setItems] = useState<ToastItem[]>([])

    useEffect(() => {
        return toast.subscribe(setItems)
    }, [])

    if (items.length === 0) return null

    return (
        <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed bottom-5 right-5 z-[9999] flex flex-col-reverse gap-3 pointer-events-none"
        >
            {items.map((item) => (
                <div key={item.id} className="pointer-events-auto">
                    <ToastCard item={item} />
                </div>
            ))}
        </div>
    )
}

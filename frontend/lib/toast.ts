/**
 * Global toast store — call toast.success(), toast.error(), etc. from anywhere.
 * Works outside React components too (e.g. axios interceptors, service files).
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
    id: string
    type: ToastType
    title?: string
    message: string
    duration: number
}

type Listener = (toasts: ToastItem[]) => void

let toasts: ToastItem[] = []
const listeners: Listener[] = []

function notify() {
    listeners.forEach((l) => l([...toasts]))
}

function genId(): string {
    return Math.random().toString(36).slice(2, 10)
}

function add(type: ToastType, message: string, title?: string, duration = 4000): string {
    const id = genId()
    const item: ToastItem = { id, type, message, title, duration }
    toasts = [...toasts, item]
    notify()

    setTimeout(() => remove(id), duration)
    return id
}

function remove(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
}

function subscribe(listener: Listener): () => void {
    listeners.push(listener)
    listener([...toasts]) // emit current state immediately
    return () => {
        const idx = listeners.indexOf(listener)
        if (idx > -1) listeners.splice(idx, 1)
    }
}

export const toast = {
    success: (message: string, title?: string, duration?: number) =>
        add('success', message, title, duration),
    error: (message: string, title?: string, duration?: number) =>
        add('error', message, title, duration),
    warning: (message: string, title?: string, duration?: number) =>
        add('warning', message, title, duration),
    info: (message: string, title?: string, duration?: number) =>
        add('info', message, title, duration),
    remove,
    subscribe,
}

"use client";
import { useEffect } from "react";
import { useNotify } from "@/hooks/useNotifications";


export default function NotificationPortal() {
    const { toasts, remove } = useNotify();


    useEffect(() => {
        const timers = toasts.map((t) => setTimeout(() => remove(t.id), 3000));
        return () => timers.forEach(clearTimeout);
    }, [toasts, remove]);


    return (
        <div className="fixed top-4 right-4 space-y-2 z-50">
            {toasts.map((t) => (
                <div
                    key={t.id}
                    className={`p-4 rounded-lg shadow-lg max-w-sm text-white ${t.type === "success" ? "bg-green-500" : t.type === "error" ? "bg-red-500" : t.type === "info" ? "bg-blue-500" : "bg-yellow-500"
                        }`}
                >
                    <div className="flex items-center space-x-2">
                        <i className={`fas ${t.type === "success" ? "fa-check-circle" : t.type === "error" ? "fa-exclamation-circle" : t.type === "info" ? "fa-info-circle" : "fa-exclamation-triangle"
                            }`} />
                        <span>{t.message}</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
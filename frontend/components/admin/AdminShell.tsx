"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/common/AdminSidebar";
import UserManagement from "@/components/admin/UserManagement";
// import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { Language } from "@/types/domain";
import { useToast } from "@/hooks/useToast";
import { useAppStore } from "@/store/useAppStore";


export type AdminSection = "users" | "analysis";


export default function AdminShell() {
    const [section, setSection] = useState<AdminSection>("users");
    const { language, setLanguage } = useAppStore();
    const toast = useToast();


    useEffect(() => {
        // Admin gate
        (async () => {
            try {
                // Call backend directly to avoid Next.js rewrite loop
                const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
                const res = await fetch(`${apiUrl}/api/check-admin`, { 
                    credentials: "include",
                    mode: 'cors'
                });
                const data = await res.json();
                if (!data?.is_admin) {
                    window.location.href = "/";
                }
            } catch (e) {
                console.error('Admin check failed:', e);
                window.location.href = "/";
            }
        })();


        // Sync language from stored preferences (cookie/localStorage)
        const prefs = ((): { language?: "en" | "vi" } => {
            try {
                const local = localStorage.getItem("vietnam_travel_ui_config");
                if (local) return JSON.parse(local);
            } catch { }
            const cookie = document.cookie
                .split(";")
                .map((c) => c.trim())
                .find((c) => c.startsWith("vietnam_travel_ui_config="));
            if (cookie) {
                try {
                    return JSON.parse(decodeURIComponent(cookie.split("=")[1]));
                } catch { }
            }
            return { language: "vi" };
        })();
        if (prefs?.language) setLanguage(prefs.language);
    }, [setLanguage]);


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <AdminSidebar active={section} onChange={setSection} />
            <div className="flex-1 p-8 admin-content">
                <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
                    {section === "users" ? (
                        <UserManagement onError={(m: string) => toast.error(m)} onInfo={(m: string) => toast.info(m)} />
                    ) : (
                        <div className="bg-white rounded-2xl shadow-xl p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                                {language === 'vi' ? 'Phân tích dữ liệu' : 'Analytics Dashboard'}
                            </h2>
                            <p className="text-gray-600">
                                {language === 'vi' ? 'Tính năng đang được phát triển...' : 'Feature under development...'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
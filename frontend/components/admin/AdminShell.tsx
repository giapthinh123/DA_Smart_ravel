"use client";
import { useState, useEffect } from "react";
import AdminSidebar from "@/components/common/AdminSidebar";
import UserManagement from "@/components/admin/UserManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import { useLanguage } from "@/hooks/useLanguage";
import { useNotify } from "@/hooks/useNotifications";


export type AdminSection = "users" | "analysis";


export default function AdminShell() {
    const [section, setSection] = useState<AdminSection>("users");
    const { changeLanguage } = useLanguage();
    const notify = useNotify();


    useEffect(() => {
        // Admin gate
        (async () => {
            try {
                const res = await fetch("/api/check-admin", { credentials: "include" });
                const data = await res.json();
                if (!data?.is_admin) {
                    window.location.href = "/";
                }
            } catch (e) {
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
        if (prefs?.language) changeLanguage(prefs.language);
    }, [changeLanguage]);


    return (
        <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <AdminSidebar active={section} onChange={setSection} />
            <div className="flex-1 p-8 admin-content">
                <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8">
                    {section === "users" ? (
                        <UserManagement onError={(m) => notify.error(m)} onInfo={(m) => notify.info(m)} />
                    ) : (
                        <AnalyticsDashboard onInfo={(m: string) => notify.info(m)} />
                    )}
                </div>
            </div>
        </div>
    );
}
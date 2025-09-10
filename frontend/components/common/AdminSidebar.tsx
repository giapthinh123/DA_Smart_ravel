"use client";


import { AdminSection } from "@/components/admin/AdminShell";
import StatusIndicator from "@/components/common/StatusIndicator";
import { useLanguage } from "@/hooks/useLanguage";


export default function AdminSidebar({
    active,
    onChange,
}: {
    active: AdminSection;
    onChange: (s: AdminSection) => void;
}) {
    const { lang, changeLanguage, t } = useLanguage();


    return (
        <aside className="admin-sidebar w-72 p-8 text-white relative z-10">
            <div className="mb-10">
                <div className="flex items-center space-x-4 mb-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-lg">
                        <i className="fas fa-cogs text-white text-xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{t("Admin Panel", "Bảng Điều Khiển Admin")}</h1>
                        <p className="text-sm opacity-80">{t("System Configuration", "Cấu Hình Hệ Thống")}</p>
                    </div>
                </div>
                <StatusIndicator text={t("System Ready", "Hệ Thống Sẵn Sàng")} />
                <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                        <span className="text-sm opacity-80">Language:</span>
                        <div className="flex space-x-1">
                            <button
                                className={`px-2 py-1 text-xs rounded transition ${lang === "en" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                                onClick={() => changeLanguage("en")}
                            >
                                EN
                            </button>
                            <button
                                className={`px-2 py-1 text-xs rounded transition ${lang === "vi" ? "bg-white/20 text-white" : "text-white/70 hover:text-white"}`}
                                onClick={() => changeLanguage("vi")}
                            >
                                VI
                            </button>
                        </div>
                    </div>
                </div>
            </div>


            <nav className="space-y-2">
                <button
                    className={`nav-item flex w-full items-center space-x-4 p-4 rounded-xl transition ${active === "users" ? "active" : ""}`}
                    onClick={() => onChange("users")}
                >
                    <i className="fas fa-users text-xl" />
                    <span>{t("User Management", "Quản Lý Người Dùng")}</span>
                </button>
                <button
                    className={`nav-item flex w-full items-center space-x-4 p-4 rounded-xl transition ${active === "analysis" ? "active" : ""}`}
                    onClick={() => onChange("analysis")}
                >
                    <i className="fas fa-chart-bar text-xl" />
                    <span>{t("Analytics", "Phân Tích")}</span>
                </button>
                <hr className="border-white/30 my-6" />
                <a href="/dashboard" className="nav-item flex items-center space-x-4 p-4 rounded-xl transition text-yellow-200 hover:text-white">
                    <i className="fas fa-arrow-left text-xl" />
                    <span>{t("Back to Dashboard", "Quay Lại Dashboard")}</span>
                </a>
            </nav>
        </aside>
    );
}
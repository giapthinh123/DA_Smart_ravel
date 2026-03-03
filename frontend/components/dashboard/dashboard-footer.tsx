import Link from "next/link"
import { Globe } from "lucide-react"
import { useTranslations } from "next-intl"

export function DashboardFooter() {
  const t = useTranslations("Dashboard.Footer")

  return (
    <footer className="border-t border-white/10 bg-slate-950/50 backdrop-blur-xl py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-cyan-400" />
            <span className="text-xl font-bold text-white">SMART TRAVEL</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
            <Link href="#privacy" className="hover:text-white transition-colors">
              {t("privacy")}
            </Link>
            <span className="text-gray-600">|</span>
            <Link href="#terms" className="hover:text-white transition-colors">
              {t("terms")}
            </Link>
            <span className="text-gray-600">|</span>
            <Link href="#support" className="hover:text-white transition-colors">
              {t("supportCenter")}
            </Link>
          </div>

          <p className="text-sm text-gray-400">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}

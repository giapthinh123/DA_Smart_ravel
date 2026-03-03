"use client"

import Link from "next/link"
import { Globe, Mail, Phone, MapPin } from "lucide-react"
import { useTranslations } from "next-intl"

export function Footer() {
  const t = useTranslations("SharedFooter")

  return (
    <footer className="bg-[#1E293B] text-[#94A3B8] border-t border-[#1E293B]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-[#5FCBC4]" />
              <span className="font-semibold text-lg text-white">TravelTour</span>
            </div>
            <p className="text-sm text-[#94A3B8] text-pretty">{t("tagline")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t("quickLinks")}</h3>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li><Link href="#home" className="hover:text-[#5FCBC4] transition-colors">{t("home")}</Link></li>
              <li><Link href="#tours" className="hover:text-[#5FCBC4] transition-colors">{t("tours")}</Link></li>
              <li><Link href="#about" className="hover:text-[#5FCBC4] transition-colors">{t("about")}</Link></li>
              <li><Link href="#contact" className="hover:text-[#5FCBC4] transition-colors">{t("contact")}</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t("support")}</h3>
            <ul className="space-y-2 text-sm text-[#94A3B8]">
              <li><Link href="#" className="hover:text-[#5FCBC4] transition-colors">{t("helpCenter")}</Link></li>
              <li><Link href="#" className="hover:text-[#5FCBC4] transition-colors">{t("termsOfService")}</Link></li>
              <li><Link href="#" className="hover:text-[#5FCBC4] transition-colors">{t("privacyPolicy")}</Link></li>
              <li><Link href="#" className="hover:text-[#5FCBC4] transition-colors">{t("faq")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4 text-white">{t("contactUs")}</h3>
            <ul className="space-y-3 text-sm text-[#94A3B8]">
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#5FCBC4]" />
                <span>info@traveltour.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#5FCBC4]" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#5FCBC4]" />
                <span>123 Travel Street, NY 10001</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#334155] pt-8 text-center text-sm text-[#94A3B8]">
          <p>&copy; {new Date().getFullYear()} {t("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}

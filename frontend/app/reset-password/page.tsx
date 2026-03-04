"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "@/services/auth.service"
import { toast } from "@/lib/toast"
import { LoaderCircle, Mail, KeyRound, ShieldCheck, ArrowLeft, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { EyeIcon, EyeCloseIcon } from "@/components/icon/icon"

type Step = "email" | "code" | "password"

export default function ResetPasswordPage() {
    const router = useRouter()
    const t = useTranslations("ResetPasswordPage")

    const [step, setStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [code, setCode] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const steps: { key: Step; icon: React.ReactNode; label: string }[] = [
        { key: "email", icon: <Mail className="w-4 h-4" />, label: t("stepEmail") },
        { key: "code", icon: <ShieldCheck className="w-4 h-4" />, label: t("stepCode") },
        { key: "password", icon: <KeyRound className="w-4 h-4" />, label: t("stepPassword") },
    ]

    const currentStepIndex = steps.findIndex((s) => s.key === step)

    // Step 1: Send code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage("")
        setIsLoading(true)
        try {
            await AuthService.forgotPassword(email)
            toast.success(t("codeSent"), t("codeSentTitle"))
            setStep("code")
        } catch (error: any) {
            toast.error(error.message || t("errorGeneric"))
        } finally {
            setIsLoading(false)
        }
    }

    // Step 2: Verify code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault()
        if (code.length !== 6) {
            toast.error(t("invalidCodeLength"))
            return
        }
        setIsLoading(true)
        try {
            await AuthService.verifyCode(email, code)
            toast.success(t("codeVerified"), t("codeVerifiedTitle"))
            setStep("password")
        } catch (error: any) {
            toast.error(error.message || t("errorGeneric"))
        } finally {
            setIsLoading(false)
        }
    }

    // Step 3: Reset password
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 8) {
            toast.error(t("passwordTooShort"))
            return
        }

        if (newPassword !== confirmPassword) {
            toast.error(t("passwordMismatch"))
            return
        }

        setIsLoading(true)
        try {
            await AuthService.resetPassword(email, newPassword)
            toast.success(t("resetSuccess"), t("resetSuccessTitle"))
            router.push("/login")
        } catch (error: any) {
            toast.error(error.message || t("errorGeneric"))
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E0F7FA] via-[#F0FDFA] to-[#ECFDF5] p-6">
            {/* Background */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(224,247,250,0.9),rgba(240,253,250,0.6)_42%,rgba(236,253,245,0.8))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(95,203,196,0.08)_0%,rgba(255,255,255,0)_70%)]" />
            </div>

            {/* Language Switcher */}
            <div className="absolute top-6 right-6 z-20">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="rounded-3xl border border-[#5FCBC4]/20 bg-white/90 p-8 backdrop-blur-2xl shadow-xl shadow-[#5FCBC4]/10">
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {steps.map((s, i) => (
                            <div key={s.key} className="flex items-center gap-2">
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${i < currentStepIndex
                                        ? "bg-[#5FCBC4] text-white"
                                        : i === currentStepIndex
                                            ? "bg-[#5FCBC4]/15 text-[#5FCBC4] ring-2 ring-[#5FCBC4]/40"
                                            : "bg-gray-100 text-gray-400"
                                        }`}
                                >
                                    {i < currentStepIndex ? <Check className="w-4 h-4" /> : s.icon}
                                </div>
                                {i < steps.length - 1 && (
                                    <div
                                        className={`w-10 h-0.5 transition-colors duration-300 ${i < currentStepIndex ? "bg-[#5FCBC4]" : "bg-gray-200"
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step 1: Email */}
                    {step === "email" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center">
                                    <Mail className="h-7 w-7 text-[#5FCBC4]" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 text-center">{t("title")}</h1>
                            <p className="text-[#64748B] mb-6 text-center text-sm">{t("subtitle")}</p>

                            <form onSubmit={handleSendCode} className="space-y-4">
                                <div className="grid gap-2">
                                    <label htmlFor="reset-email" className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                                        {t("emailLabel")}
                                    </label>
                                    <input
                                        id="reset-email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoComplete="email"
                                        placeholder={t("emailPlaceholder")}
                                        className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                                        autoFocus
                                    />
                                </div>

                                {errorMessage && (
                                    <p className="text-sm text-[#d34e4e]">{errorMessage}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full h-12 rounded-2xl bg-[#5FCBC4] text-white font-semibold shadow-lg shadow-[#5FCBC4]/30 hover:bg-[#4AB8B0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {isLoading ? t("sending") : t("sendCode")}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 2: Code Verification */}
                    {step === "code" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center">
                                    <ShieldCheck className="h-7 w-7 text-[#5FCBC4]" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 text-center">{t("codeTitle")}</h1>
                            <p className="text-[#64748B] mb-4 text-center text-sm">{t("codeSubtitle")}</p>

                            {/* Email display */}
                            <div className="mb-5 p-3 rounded-xl bg-[#F8FFFE] border border-gray-200">
                                <p className="text-xs text-[#64748B] mb-1">{t("sentTo")}</p>
                                <p className="text-sm font-medium text-[#0F172A]">{email}</p>
                            </div>

                            <form onSubmit={handleVerifyCode} className="space-y-4">
                                <div className="grid gap-2">
                                    <label className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                                        {t("codeLabel")}
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                                        maxLength={6}
                                        placeholder="123456"
                                        className="h-14 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 text-center text-2xl tracking-widest font-mono focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                                        autoFocus
                                    />
                                    <p className="text-xs text-[#64748B] text-center">{t("codeHint")}</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={code.length !== 6}
                                    className="w-full h-12 rounded-2xl bg-[#5FCBC4] text-white font-semibold shadow-lg shadow-[#5FCBC4]/30 hover:bg-[#4AB8B0] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {t("verifyCode")}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Step 3: New Password */}
                    {step === "password" && (
                        <>
                            <div className="flex justify-center mb-5">
                                <div className="w-14 h-14 rounded-full bg-[#5FCBC4]/15 flex items-center justify-center">
                                    <KeyRound className="h-7 w-7 text-[#5FCBC4]" />
                                </div>
                            </div>
                            <h1 className="text-2xl font-bold text-[#0F172A] mb-2 text-center">{t("newPasswordTitle")}</h1>
                            <p className="text-[#64748B] mb-6 text-center text-sm">{t("newPasswordSubtitle")}</p>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                {/* New Password */}
                                <div className="grid gap-2">
                                    <label htmlFor="new-password" className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                                        {t("newPasswordLabel")}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="new-password"
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder={t("newPasswordPlaceholder")}
                                            className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                                            autoFocus
                                        />
                                        {newPassword && (
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors focus:outline-none z-10"
                                            >
                                                {showPassword ? <EyeCloseIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div className="grid gap-2">
                                    <label htmlFor="confirm-password" className="text-sm uppercase tracking-[0.25em] text-[#5FCBC4] font-medium">
                                        {t("confirmPasswordLabel")}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirm-password"
                                            type={showConfirm ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder={t("confirmPasswordPlaceholder")}
                                            className="h-12 w-full rounded-2xl border border-gray-200 bg-[#F8FFFE] px-4 pr-12 text-[#1E293B] placeholder:text-[#94A3B8] focus-visible:border-[#5FCBC4] focus-visible:ring-2 focus-visible:ring-[#5FCBC4]/30 focus-visible:outline-none transition-colors"
                                        />
                                        {confirmPassword && (
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(!showConfirm)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#5FCBC4] transition-colors focus:outline-none z-10"
                                            >
                                                {showConfirm ? <EyeCloseIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !newPassword || !confirmPassword}
                                    className="w-full h-12 rounded-2xl bg-[#5FCBC4] text-white font-semibold shadow-lg shadow-[#5FCBC4]/30 hover:bg-[#4AB8B0] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                    {isLoading ? t("resetting") : t("resetButton")}
                                </button>
                            </form>
                        </>
                    )}

                    {/* Back to login */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => router.push("/login")}
                            className="inline-flex items-center gap-1.5 text-sm text-[#5FCBC4] hover:text-[#4AB8B0] transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t("backToLogin")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

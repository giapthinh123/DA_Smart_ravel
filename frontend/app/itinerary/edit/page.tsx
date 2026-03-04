"use client"

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthGuard } from "@/components/auth-guard"
import { LanguageSwitcher } from "@/components/i18n/language-switcher"
import { useTranslations } from "next-intl"
import { ItineraryService } from "@/services/itinerary.service"

interface EditContext {
    itinerary_id: string
    booking_id: string
    tour_type: string
    booking_status: string
    name: string
    destination: string
    start_date: string
    trip_duration_days: number
    guest_count: number
    budget: number
    has_generated_days: boolean
}

function EditItineraryContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const t = useTranslations("EditItineraryPage")
    const tCommon = useTranslations("Common")

    const bookingId = searchParams.get("bookingId") || ""

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [context, setContext] = useState<EditContext | null>(null)

    const [name, setName] = useState("")
    const [startDate, setStartDate] = useState("")
    const [tripDurationDays, setTripDurationDays] = useState<number>(1)
    const [guestCount, setGuestCount] = useState<number>(1)
    const [budget, setBudget] = useState<number>(0)

    useEffect(() => {
        const loadContext = async () => {
            if (!bookingId) {
                setError(t("errors.missingBookingId"))
                setLoading(false)
                return
            }

            try {
                setLoading(true)
                setError(null)

                const data = await ItineraryService.getItineraryEditContext({
                    booking_id: bookingId
                })

                setContext(data as EditContext)
                setName(data.name || "")
                setStartDate(data.start_date || "")
                setTripDurationDays(data.trip_duration_days || 1)
                setGuestCount(data.guest_count || 1)
                setBudget(data.budget || 0)
            } catch (err: any) {
                setError(err.message || t("errors.loadFailed"))
            } finally {
                setLoading(false)
            }
        }

        loadContext()
    }, [bookingId, t])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!context) return

        setError(null)

        if (!startDate) {
            setError(t("validation.startDateRequired"))
            return
        }
        if (!tripDurationDays || tripDurationDays < 1) {
            setError(t("validation.durationInvalid"))
            return
        }
        if (!guestCount || guestCount < 1) {
            setError(t("validation.guestsInvalid"))
            return
        }
        if (budget < 0) {
            setError(t("validation.budgetInvalid"))
            return
        }

        const changingCoreTimeline =
            (startDate !== context.start_date || tripDurationDays !== context.trip_duration_days) &&
            context.has_generated_days

        if (changingCoreTimeline) {
            const confirmed = window.confirm(t("confirm.regenerateTimeline")) // eslint-disable-line no-alert
            if (!confirmed) {
                return
            }
        }

        try {
            setSaving(true)
            const result = await ItineraryService.updateItineraryMetadata({
                booking_id: context.booking_id,
                start_date: startDate,
                trip_duration_days: tripDurationDays,
                guest_count: guestCount,
                budget,
                name: name || context.name
            })

            router.push(`/itinerary?itineraryId=${result.itinerary_id}`)
        } catch (err: any) {
            setError(err.message || t("errors.saveFailed"))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F0FDFA] text-[#3F3F46]">
            <header className="border-b border-[#E4E4E7] bg-white sticky top-0 z-50 shadow-sm">
                <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="text-sm text-[#A1A1AA] hover:text-[#5FCBC4] transition"
                        >
                            {tCommon("back")}
                        </button>
                        <div className="h-6 w-px bg-[#E4E4E7]" />
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#A1A1AA]">VietJourney</p>
                            <h1 className="text-sm font-semibold text-[#0F4C5C]">{t("title")}</h1>
                        </div>
                    </div>
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-8">
                {loading && (
                    <div className="rounded-2xl border border-[#E4E4E7] bg-white p-8 text-center">
                        <p className="text-lg font-semibold text-[#0F4C5C] mb-2">{tCommon("loading")}</p>
                        <p className="text-sm text-[#A1A1AA]">{t("loadingDesc")}</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 mb-6">
                        <p className="text-sm font-semibold text-red-600 mb-2">{t("errors.title")}</p>
                        <p className="text-sm text-red-500">{error}</p>
                    </div>
                )}

                {!loading && context && (
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-2xl border border-[#E4E4E7] bg-white p-8 space-y-8 shadow-sm"
                    >
                        <div>
                            <h2 className="text-xl font-semibold text-[#0F4C5C] mb-1">{t("sectionOverview")}</h2>
                            <p className="text-sm text-[#A1A1AA]">{t("sectionOverviewDesc")}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.name")}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 focus:border-[#5FCBC4]"
                                    placeholder={t("placeholders.name")}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.destination")}
                                </label>
                                <input
                                    type="text"
                                    value={context.destination}
                                    readOnly
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm bg-[#F9FAFB] text-[#A1A1AA]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.startDate")}
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 focus:border-[#5FCBC4]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.tripDurationDays")}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={tripDurationDays}
                                    onChange={e => setTripDurationDays(Number(e.target.value) || 1)}
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 focus:border-[#5FCBC4]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.guestCount")}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={guestCount}
                                    onChange={e => setGuestCount(Number(e.target.value) || 1)}
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 focus:border-[#5FCBC4]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#3F3F46]">
                                    {t("fields.budget")}
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={budget}
                                    onChange={e => setBudget(Number(e.target.value) || 0)}
                                    className="w-full rounded-xl border border-[#E4E4E7] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#5FCBC4]/20 focus:border-[#5FCBC4]"
                                />
                            </div>
                        </div>

                        {context.has_generated_days && (
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                {t("warnings.hasGeneratedDays")}{" "}
                                <span className="font-semibold">{t("warnings.mayRegenerate")}</span>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4 border-t border-[#E4E4E7]">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 rounded-xl border border-[#E4E4E7] text-sm text-[#3F3F46] hover:bg-[#F9FAFB] transition"
                            >
                                {tCommon("cancel")}
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-6 py-2 rounded-xl bg-[#5FCBC4] text-sm font-semibold text-white hover:bg-[#4AB8B0] transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {saving ? t("buttons.saving") : t("buttons.continue")}
                            </button>
                        </div>
                    </form>
                )}
            </main>
        </div>
    )
}

export default function EditItineraryPage() {
    return (
        <AuthGuard>
            <EditItineraryContent />
        </AuthGuard>
    )
}

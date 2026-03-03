"use client"

import React, { useEffect, useState } from "react"
import { Dropdown } from 'primereact/dropdown'
import { City, Place } from "@/types/domain"
import { Slider } from 'primereact/slider'
import { PlacesService } from "@/services/places.service"
import { Star, Loader2, MapPin } from "lucide-react"
import { toast } from "@/lib/toast"
import { useTranslations } from "next-intl"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

interface PlaceDetails {
  displayName_text: string
  rating: number
  userRatingCount: number
  avg_price: number
  editorialSummary_text?: string
  image_url?: string[]
  reviews?: Array<{
    rating: number
    text: { text: string }
    relativePublishTimeDescription: string
    authorAttribution: { displayName: string }
  }>
}

export default function ActivitiesSearch() {
  const t = useTranslations("ActivitiesSearch")
  const [locations, setLocations] = useState<City[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([0, 30])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<Place[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [placeDetails, setPlaceDetails] = useState<Record<string, PlaceDetails>>({})
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set())
  const [selectedImageIndex, setSelectedImageIndex] = useState<Record<string, number>>({})

  useEffect(() => {
    const city_data = localStorage.getItem('cities_data')
    if (city_data) {
      setLocations(JSON.parse(city_data))
    }
  }, [])

  const handleSubmit = async () => {
    if (!selectedLocation) {
      toast.warning(t("valLocation"), t("valLocationTitle"))
      return
    }

    setIsLoading(true)
    setResults([])
    setExpandedId(null)

    try {
      const data = await PlacesService.getPlacesByCityId(String(selectedLocation))
      const filtered = data.attraction.filter(
        place => place.avg_price >= budgetRange[0] && place.avg_price <= budgetRange[1]
      )
      setResults(filtered)
    } catch (error: any) {
      console.error("Activities search error:", error)
      toast.error(error.message || t("errorSearch"), t("errorSearchTitle"))
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPlaceDetails = async (placeId: string) => {
    if (placeDetails[placeId] || loadingDetails.has(placeId)) return

    setLoadingDetails(prev => new Set(prev).add(placeId))
    try {
      const data = await PlacesService.getPlaceById(placeId)
      setPlaceDetails(prev => ({ ...prev, [placeId]: data }))
    } catch (err) {
      console.error("Failed to fetch place details:", err)
    } finally {
      setLoadingDetails(prev => {
        const s = new Set(prev)
        s.delete(placeId)
        return s
      })
    }
  }

  const togglePlace = (placeId: string) => {
    if (expandedId === placeId) {
      setExpandedId(null)
    } else {
      setExpandedId(placeId)
      fetchPlaceDetails(placeId)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#5FCBC4]">
          {t("navigator")}
        </p>
        <h3 className="text-2xl font-semibold text-[#0F4C5C]">
          {t("title")}
        </h3>
        <p className="mt-2 text-sm text-[#3F3F46]">
          {t("description")}
        </p>
      </div>

      <div className="space-y-5">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              {t("location")} <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.value)}
              options={locations.map((city) => ({
                label: city.city + ", " + city.country,
                value: city.id
              }))}
              optionLabel="label"
              optionValue="value"
              placeholder={t("selectLocation")}
              filter
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
          <div className="dashboard-form__field">
            <label htmlFor="hotel-budget" className="dashboard-form__label">
              {t("budgetRange")}
            </label>
            <div className="mt-4 px-2">
              <Slider
                value={budgetRange}
                onChange={(e) => {
                  const newValue = e.value as [number, number]
                  if (newValue[0] <= newValue[1] - 10) {
                    setBudgetRange(newValue)
                  }
                }}
                range
                min={0}
                max={100}
                step={1}
                className="dashboard-form__slider"
              />
              <div className="flex justify-between mt-3 text-sm">
                <span className="font-medium text-[#5FCBC4]">${budgetRange[0]}</span>
                <span className="text-[#A1A1AA]">{t("to")}</span>
                <span className="font-medium text-[#5FCBC4]">${budgetRange[1]}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "h-12 w-full rounded-xl bg-[#5FCBC4] text-sm font-semibold text-white transition-all",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-[#4AB8B0] hover:scale-[1.02]"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("processing")}
            </span>
          ) : (
            t("findActivities")
          )}
        </button>

        {/* Results Section */}
        {results.length > 0 && (
          <div className="mt-8">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-[#0F4C5C]">
                {t("found")} {results.length} {results.length !== 1 ? t("activities") : t("activity")}
              </h4>
            </div>
            <div className="space-y-4">
              {results.map((place) => {
                const isExpanded = expandedId === place.id
                const details = placeDetails[place.id]
                const isLoadingDetail = loadingDetails.has(place.id)

                return (
                  <div key={place.id} className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 overflow-hidden">
                    {/* Card Header - Clickable */}
                    <div
                      onClick={() => togglePlace(place.id)}
                      className="cursor-pointer p-5 transition-all hover:bg-violet-100/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-[#0F4C5C] mb-2">{place.displayName_text}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#A1A1AA]">
                            <MapPin className="w-4 h-4" />
                            <span>{place.city}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-400 mb-2">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="font-bold">{place.rating}</span>
                          </div>
                          <span className="text-lg font-bold text-emerald-600">${place.avg_price}</span>
                          <p className="text-xs text-[#A1A1AA]">{t("avgCost")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-[#A1A1AA]">
                        <span>{place.userRatingCount.toLocaleString()} {t("reviews")}</span>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-violet-200">
                        {isLoadingDetail ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-[#5FCBC4]" />
                          </div>
                        ) : details ? (
                          <div className="space-y-6">
                            {/* Main Info Grid - Image Left, Info Right */}
                            <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
                              {/* Left - Image Gallery */}
                              {details.image_url && details.image_url.length > 0 && (() => {
                                const currentImageIdx = selectedImageIndex[place.id] || 0
                                return (
                                  <div className="space-y-3">
                                    {/* Main Image */}
                                    <div
                                      className="relative rounded-xl overflow-hidden group"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <img
                                        src={details.image_url[currentImageIdx]}
                                        alt={details.displayName_text}
                                        className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                                      />
                                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-sm">
                                        <span className="text-xs font-semibold text-white">{currentImageIdx + 1} / {details.image_url.length}</span>
                                      </div>
                                    </div>

                                    {/* Thumbnail Gallery */}
                                    {details.image_url.length > 1 && (
                                      <div className="grid grid-cols-4 gap-2">
                                        {details.image_url.slice(0, 8).map((url, idx) => (
                                          <div
                                            key={idx}
                                            className={`rounded-lg overflow-hidden group cursor-pointer transition-all ${currentImageIdx === idx
                                              ? 'ring-2 ring-[#5FCBC4] ring-offset-2 ring-offset-[#F0FDFA]'
                                              : 'opacity-70 hover:opacity-100'
                                              }`}
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setSelectedImageIndex(prev => ({ ...prev, [place.id]: idx }))
                                            }}
                                          >
                                            <img
                                              src={url}
                                              alt={`${details.displayName_text} ${idx + 1}`}
                                              className="w-full h-20 object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })()}

                              {/* Right - Place Information */}
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-2xl font-bold text-[#0F4C5C] mb-3">
                                    {details.displayName_text}
                                  </h4>

                                  {/* Rating & Reviews */}
                                  <div className="flex items-center gap-4 mb-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                                      <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                                      <span className="font-bold text-amber-400 text-lg">{details.rating}</span>
                                    </div>
                                    <span className="text-sm text-[#A1A1AA]">
                                      ({details.userRatingCount?.toLocaleString() || 0} {t("reviews")})
                                    </span>
                                  </div>

                                  {/* Average Price */}
                                  {details.avg_price && (
                                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                                      <span className="text-emerald-600 text-2xl">💵</span>
                                      <div>
                                        <p className="text-xs text-emerald-500 uppercase tracking-wide">{t("avgPrice")}</p>
                                        <p className="text-xl font-bold text-emerald-700">${details.avg_price}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Editorial Summary */}
                            {details.editorialSummary_text && (
                              <div className="p-4 rounded-xl bg-[#F0FDFA] border border-[#E4E4E7]">
                                <h5 className="text-sm font-semibold text-[#5FCBC4] mb-2 uppercase tracking-wide">{t("about")}</h5>
                                <p className="text-sm text-[#3F3F46] leading-relaxed">
                                  {details.editorialSummary_text}
                                </p>
                              </div>
                            )}

                            {/* Reviews Section */}
                            {details.reviews && details.reviews.length > 0 && (
                              <div className="space-y-3">
                                <h5 className="text-sm font-semibold text-[#5FCBC4] uppercase tracking-wide">{t("recentReviews")}</h5>
                                <div className="space-y-3 max-h-96 overflow-y-auto">
                                  {details.reviews.slice(0, 3).map((review, idx) => (
                                    <div
                                      key={idx}
                                      className="p-4 rounded-xl bg-white border border-[#E4E4E7] hover:bg-[#F0FDFA] transition-colors"
                                    >
                                      {/* Review Header */}
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-amber-200">
                                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                            <span className="font-bold text-amber-600 text-sm">{review.rating}</span>
                                          </div>
                                          {review.authorAttribution?.displayName && (
                                            <span className="text-sm font-medium text-[#3F3F46]">
                                              {review.authorAttribution.displayName}
                                            </span>
                                          )}
                                        </div>
                                        {review.relativePublishTimeDescription && (
                                          <span className="text-xs text-[#A1A1AA]">
                                            {review.relativePublishTimeDescription}
                                          </span>
                                        )}
                                      </div>

                                      {/* Review Text */}
                                      {review.text?.text && (
                                        <p className="text-sm text-[#3F3F46] leading-relaxed line-clamp-4">
                                          {review.text.text}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-[#A1A1AA] py-4">{t("clickToLoad")}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

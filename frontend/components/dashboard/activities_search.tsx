"use client"

import React, { useEffect, useState } from "react"
import { Dropdown } from 'primereact/dropdown'
import { City } from "@/types/domain"
import { NumericFormat } from 'react-number-format'
import { InputText } from 'primereact/inputtext'
import { Calendar } from 'primereact/calendar'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

const activityTypes = [
  { label: "Cultural & Heritage", value: "cultural" },
  { label: "Adventure & Outdoor", value: "adventure" },
  { label: "Nature & Eco-tourism", value: "nature" },
  { label: "Water Activities", value: "water" },
  { label: "Wellness & Spa", value: "wellness" },
  { label: "Nightlife & Entertainment", value: "nightlife" },
  { label: "Shopping & Markets", value: "shopping" },
  { label: "Workshops & Classes", value: "workshops" },
]

const durationOptions = [
  { label: "Half day (< 4 hours)", value: "half_day" },
  { label: "Full day (4-8 hours)", value: "full_day" },
  { label: "Multiple days", value: "multi_day" },
]

export default function ActivitiesSearch() {
  const [locations, setLocations] = useState<City[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [activityType, setActivityType] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [activityDate, setActivityDate] = useState<Date | null>(null)
  const [budget, setBudget] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const city_data = localStorage.getItem('cities_data')
    if (city_data) {
      setLocations(JSON.parse(city_data))
    }
  }, [])

  const handleSubmit = () => {
    if (!selectedLocation || !activityType) {
      alert("Please fill all required fields")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      console.log("Activities search:", { selectedLocation, activityType, duration, activityDate, budget })
      setIsLoading(false)
      alert("Activities search completed!")
    }, 1500)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#FFE5B4]">
          Experience Finder
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Explore activities and unique experiences
        </h3>
        <p className="mt-2 text-sm text-[#D0D7D8]">
          Discover adventures, cultural experiences, and local activities tailored to your interests.
        </p>
      </div>

      <div className="space-y-5">
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Location <span className="text-red-400">*</span>
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
              placeholder="Select location"
              filter
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Activity Type <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={activityType}
              onChange={(e) => setActivityType(e.value)}
              options={activityTypes}
              optionLabel="label"
              optionValue="value"
              placeholder="Select activity type"
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Duration
            </label>
            <Dropdown
              value={duration}
              onChange={(e) => setDuration(e.value)}
              options={durationOptions}
              optionLabel="label"
              optionValue="value"
              placeholder="Select duration"
              showClear
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
          <div className="dashboard-form__field">
            <label htmlFor="activity-date" className="dashboard-form__label">
              Preferred Date
            </label>
            <Calendar
              id="activity-date"
              value={activityDate}
              onChange={(e) => setActivityDate(e.value as Date | null)}
              placeholder="Select date"
              minDate={new Date()}
              showIcon
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
        </div>

        <div className="mb-12 grid gap-4 sm:grid-cols-1">
          <div className="dashboard-form__field">
            <label htmlFor="activity-budget" className="dashboard-form__label">
              Budget per person
            </label>
            <NumericFormat
              customInput={InputText}
              id="activity-budget"
              className="dashboard-form__prime"
              placeholder="Enter your budget…"
              value={budget || ''}
              onValueChange={(values) => {
                setBudget(values.floatValue || 0)
              }}
              thousandSeparator=","
              decimalSeparator="."
              suffix=" $"
              allowNegative={false}
              isAllowed={(values) => {
                const { floatValue } = values
                return floatValue === undefined || floatValue <= 100000
              }}
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className={cn(
            "h-12 w-full rounded-xl bg-gradient-to-r from-[#FFEED0] via-[#FFD79E] to-[#FFB56D] text-sm font-semibold text-[#2B1200] shadow-[0_20px_60px_-20px_rgba(255,186,102,0.85)] transition-all",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02] hover:shadow-[0_20px_70px_-20px_rgba(255,186,102,0.95)]"
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            "Find activities"
          )}
        </button>
      </div>
    </div>
  )
}

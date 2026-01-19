"use client"

import React, { useState } from "react"
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function HotelsSearch() {
  const [location, setLocation] = useState("")
  const [dates, setDates] = useState<any>(null)
  const [guests, setGuests] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const locationOptions = [
    { label: 'Ha Noi', value: 'hanoi' },
    { label: 'Ho Chi Minh', value: 'hcm' },
    { label: 'Da Nang', value: 'danang' },
    { label: 'Phu Quoc', value: 'phuquoc' },
    { label: 'Nha Trang', value: 'nhatrang' },
  ]

  const guestOptions = [
    { label: '1 room, 2 adults', value: '1r2a' },
    { label: '1 room, 1 adult', value: '1r1a' },
    { label: '2 rooms, 4 adults', value: '2r4a' },
    { label: '1 room, 2 adults, 1 child', value: '1r2a1c' },
  ]

  const handleSubmit = () => {
    if (!location || !dates || !guests) {
      alert("Please fill all required fields")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      console.log("Hotels search:", { location, dates, guests })
      setIsLoading(false)
      alert("Hotel search completed!")
    }, 1500)
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#FFE5B4]">
          Accommodation Finder
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Find curated and budget-aligned accommodation
        </h3>
        <p className="mt-2 text-sm text-[#D0D7D8]">
          Search for hotels and stays that match your preferences and budget range.
        </p>
      </div>

      <div className="space-y-5">
        <div className="dashboard-form__field">
          <label className="dashboard-form__label">
            Location <span className="text-red-400">**</span>
          </label>
          <Dropdown
            value={location}
            onChange={(e) => setLocation(e.value)}
            options={locationOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="Select province"
            filter
            showClear
            className="dashboard-form__prime"
            panelClassName="dashboard-form__prime-panel"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Check-in <span className="text-red-400">*</span>
            </label>
            <Calendar
              placeholder="Check-in date"
              selectionMode="range"
              value={dates}
              onChange={(event) => setDates(event.value as any)}
              readOnlyInput
              hideOnRangeSelection
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              appendTo="self"
              className="dashboard-form__prime"
            />
          </div>

          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Check-out <span className="text-red-400">*</span>
            </label>
            <div className="dashboard-form__prime opacity-60 pointer-events-none flex items-center">
              <span className="text-[#B6C2C6]">Selected with check-in</span>
            </div>
          </div>
        </div>

        <div className="dashboard-form__field">
          <label className="dashboard-form__label">
            Guests
          </label>
          <Dropdown
            value={guests}
            onChange={(e) => setGuests(e.value)}
            options={guestOptions}
            optionLabel="label"
            optionValue="value"
            placeholder="1 room, 2 adults"
            className="dashboard-form__prime"
            panelClassName="dashboard-form__prime-panel"
          />
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
            "Generate proposal"
          )}
        </button>
      </div>
    </div>
  )
}


"use client"

import React, { useEffect, useState } from "react"
import { Dropdown } from 'primereact/dropdown'
import { City } from "@/types/domain"
import { Slider } from 'primereact/slider'

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function FoodSearch() {
  const [locations, setLocations] = useState<City[]>([])
  const [selectedLocation, setSelectedLocation] = useState<number | null>(null)
  const [cuisineType, setCuisineType] = useState<string | null>(null)
  const [mealType, setMealType] = useState<string | null>(null)
  const [budgetRange, setBudgetRange] = useState<[number, number]>([50, 300])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const city_data = localStorage.getItem('cities_data')
    if (city_data) {
      setLocations(JSON.parse(city_data))
    }
  }, [])

  const handleSubmit = () => {
    if (!selectedLocation || !cuisineType) {
      alert("Please fill all required fields")
      return
    }

    setIsLoading(true)
    setTimeout(() => {
      console.log("Food search:", { selectedLocation, cuisineType, mealType, budgetRange })
      setIsLoading(false)
      alert("Food search completed!")
    }, 1500)
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#5FCBC4]">
          Culinary Explorer
        </p>
        <h3 className="text-2xl font-semibold text-[#0F4C5C]">
          Discover local flavors and dining experiences
        </h3>
        <p className="mt-2 text-sm text-[#3F3F46]">
          Search for restaurants, street food, and culinary experiences that match your taste.
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
            <label htmlFor="hotel-budget" className="dashboard-form__label">
              Budget Range (per night)
            </label>
            <div className="mt-4 px-2">
              <Slider
                value={budgetRange}
                onChange={(e) => {
                  const newValue = e.value as [number, number]
                  if (newValue[0] <= newValue[1] - 100) {
                    setBudgetRange(newValue)
                  }
                }}
                range
                min={0}
                max={1000}
                step={10}
                className="dashboard-form__slider"
              />
              <div className="flex justify-between mt-3 text-sm">
                <span className="font-medium text-[#5FCBC4]">${budgetRange[0]}</span>
                <span className="text-[#A1A1AA]">to</span>
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
              Processing...
            </span>
          ) : (
            "Search restaurants"
          )}
        </button>
      </div>
    </div >
  )
}

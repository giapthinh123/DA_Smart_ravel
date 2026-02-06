"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Users, Calendar } from "lucide-react"
import type { TripDetails } from "@/app/schedule/build/page"
import { CitySearch } from "./city-search"

type TripDetailsStepProps = {
  onComplete: (details: TripDetails) => void
  initialData: TripDetails
}

export function TripDetailsStep({ onComplete, initialData }: TripDetailsStepProps) {
  const [formData, setFormData] = useState<TripDetails>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof TripDetails, string>>>({})

  const validateForm = () => {
    const newErrors: Partial<Record<keyof TripDetails, string>> = {}

    if (!formData.departure) newErrors.departure = "Departure city is required"
    if (!formData.destination) newErrors.destination = "Destination city is required"
    if (!formData.budget) {
      newErrors.budget = "Budget is required"
    } else if (Number(formData.budget) < 100) {
      newErrors.budget = "Budget must be at least $100"
    }
    if (!formData.adults || Number(formData.adults) < 1) {
      newErrors.adults = "At least 1 adult is required"
    }
    if (!formData.startDate) newErrors.startDate = "Start date is required"
    if (!formData.endDate) newErrors.endDate = "End date is required"

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate)
      const end = new Date(formData.endDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      if (start < today) {
        newErrors.startDate = "Start date must be in the future"
      }
      if (end <= start) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onComplete(formData)
    }
  }

  const handleChange = (field: keyof TripDetails, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const isFormValid =
    formData.departure &&
    formData.destination &&
    formData.budget &&
    Number(formData.budget) >= 100 &&
    formData.adults &&
    Number(formData.adults) >= 1 &&
    formData.startDate &&
    formData.endDate

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Enter Trip Details</CardTitle>
        <p className="text-muted-foreground">Tell us about your travel plans</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Departure & Destination */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="departure">
                Departure City <span className="text-red-500">*</span>
              </Label>
              <CitySearch
                value={formData.departure}
                onChange={(value) => handleChange("departure", value)}
                placeholder="Select departure city"
              />
              {errors.departure && <p className="text-sm text-red-500">{errors.departure}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">
                Destination <span className="text-red-500">*</span>
              </Label>
              <CitySearch
                value={formData.destination}
                onChange={(value) => handleChange("destination", value)}
                placeholder="Select destination"
              />
              {errors.destination && <p className="text-sm text-red-500">{errors.destination}</p>}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">
              Preferred Budget (per person) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="budget"
                type="number"
                min="100"
                step="50"
                value={formData.budget}
                onChange={(e) => handleChange("budget", e.target.value)}
                className="pl-10"
                placeholder="Enter your budget"
              />
            </div>
            {errors.budget && <p className="text-sm text-red-500">{errors.budget}</p>}
          </div>

          {/* Guests */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Add Guests <span className="text-red-500">*</span>
            </Label>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="adults" className="text-sm font-normal">
                  Adults
                </Label>
                <Input
                  id="adults"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.adults}
                  onChange={(e) => handleChange("adults", e.target.value)}
                  placeholder="0"
                />
                {errors.adults && <p className="text-xs text-red-500">{errors.adults}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="children" className="text-sm font-normal">
                  Children (2-12)
                </Label>
                <Input
                  id="children"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.children}
                  onChange={(e) => handleChange("children", e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="infants" className="text-sm font-normal">
                  Infants (&lt;2)
                </Label>
                <Input
                  id="infants"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.infants}
                  onChange={(e) => handleChange("infants", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Travel Dates <span className="text-red-500">*</span>
            </Label>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="text-sm font-normal">
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.startDate && <p className="text-xs text-red-500">{errors.startDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate" className="text-sm font-normal">
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  min={formData.startDate || new Date().toISOString().split("T")[0]}
                />
                {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" size="lg" className="w-full" disabled={!isFormValid}>
            Build Itinerary
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

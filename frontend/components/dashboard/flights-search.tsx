"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { api } from "@/lib/axios"
import { City, data_build_tour } from "@/types/domain"
import { useRouter } from "next/navigation"
import { CityService } from "@/services/city.service"
import { toast } from "@/lib/toast"
import { useTranslations } from "next-intl"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function FlightsSearch({ data_build_tour }: { data_build_tour: data_build_tour }) {
  const router = useRouter()
  const t = useTranslations("FlightsSearch")
  const [departure, setDeparture] = useState<string | null>(data_build_tour.departure)
  const [destination, setDestination] = useState<string | null>(data_build_tour.destination)
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [flightDepartureDate, setFlightDepartureDate] = useState<Date | null>(null)
  const [flightReturnDate, setFlightReturnDate] = useState<Date | null>(null)
  const [formattedFlightDepartureDate, setFormattedFlightDepartureDate] = useState<string>('')
  const [formattedFlightReturnDate, setFormattedFlightReturnDate] = useState<string>('')
  const [dataBuildTour, setDataBuildTour] = useState<data_build_tour>(data_build_tour)

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await CityService.getCities()
        if (response && Array.isArray(response)) {
          setCities(response)
        }
      } catch (error) {
        console.error('Error fetching cities:', error)
      }
    }
    fetchCities()
  }, [])

  // Format date to YYYY-MM-DD for backend API
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  }
  const handleSubmit = useCallback(() => {
    const missing: string[] = []
    if (!departure) missing.push(t("valDeparture"))
    if (!destination) missing.push(t("valDestination"))
    if (!flightDepartureDate) missing.push(t("valFlightDeparture"))
    if (!flightReturnDate) missing.push(t("valFlightReturn"))

    if (missing.length > 0) {
      toast.warning(`${t("pleaseFillAll")} ${missing.join(', ')}.`, t("missingInfo"))
      return
    }
    dataBuildTour.flight_departure_date = formattedFlightDepartureDate
    dataBuildTour.flight_return_date = formattedFlightReturnDate

    if (dataBuildTour.departure == "") {
      dataBuildTour.departure = departure || ""
    }
    if (dataBuildTour.destination == "") {
      dataBuildTour.destination = destination || ""
    }

    // Đồng bộ ngày chuyến đi với ngày bay (để currentTripData có departureDate/returnDate)
    if (!dataBuildTour.departureDate || dataBuildTour.departureDate === "") {
      dataBuildTour.departureDate = formattedFlightDepartureDate
    }
    if (!dataBuildTour.returnDate || dataBuildTour.returnDate === "") {
      dataBuildTour.returnDate = formattedFlightReturnDate
    }

    // Lưu dữ liệu vào sessionStorage thay vì truyền qua URL
    sessionStorage.setItem('flightSearchData', JSON.stringify(dataBuildTour))

    // Navigate không cần query params
    router.push('/flights')
  }, [dataBuildTour, departure, destination, flightDepartureDate, flightReturnDate, formattedFlightDepartureDate, formattedFlightReturnDate, router])

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
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              {t("departure")} <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={departure || ""}
              onChange={(e) => setDeparture(e.value)}
              options={cities.map((city) => ({
                label: city.city + ", " + city.country,
                value: city.id
              }))}
              optionLabel="label"
              optionValue="value"
              placeholder={t("searchDeparture")}
              filter
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>

          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              {t("destination")} <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={destination || ""}
              onChange={(e) => setDestination(e.value)}
              options={cities.map((city) => ({
                label: city.city + ", " + city.country,
                value: city.id
              }))} optionLabel="label"
              optionValue="value"
              placeholder={t("searchDestination")}
              filter
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              {t("flightDeparture")} <span className="text-red-400">*</span>
            </label>
            <Calendar
              placeholder={t("selectDeparture")}
              selectionMode="single"
              value={flightDepartureDate}
              onChange={(event) => {
                const selectedDate = event.value as Date
                setFlightDepartureDate(selectedDate)

                // Format and store date as dd/mm/yyyy
                if (selectedDate) {
                  const formatted = formatDate(selectedDate)
                  setFormattedFlightDepartureDate(formatted)
                  console.log('Formatted Flight Departure Date:', formatted)
                }
              }}
              readOnlyInput
              dateFormat="dd/mm/yy"
              minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
              appendTo="self"
              className="dashboard-form__prime"
            />
          </div>
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              {t("flightReturn")} <span className="text-red-400">*</span>
            </label>
            <Calendar
              placeholder={t("selectReturn")}
              selectionMode="single"
              value={flightReturnDate}
              onChange={(event) => {
                const selectedDate = event.value as Date
                setFlightReturnDate(selectedDate)

                // Format and store date as dd/mm/yyyy
                if (selectedDate) {
                  const formatted = formatDate(selectedDate)
                  setFormattedFlightReturnDate(formatted)
                  console.log('Formatted Flight Return Date:', formatted)
                }
              }}
              readOnlyInput
              dateFormat="dd/mm/yy"
              minDate={
                flightDepartureDate
                  ? new Date(
                    flightDepartureDate.getFullYear(),
                    flightDepartureDate.getMonth(),
                    flightDepartureDate.getDate() + 1
                  )
                  : new Date()
              }
              appendTo="self"
              className="dashboard-form__prime"
            />
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
            t("searchFlights")
          )}
        </button>
      </div>
    </div>
  )
}


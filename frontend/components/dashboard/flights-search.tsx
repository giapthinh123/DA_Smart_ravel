"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { api } from "@/lib/axios"
import { City, data_build_tour } from "@/types/domain"
import { useRouter } from "next/navigation"
import { CityService } from "@/services/city.service"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

export default function FlightsSearch({ data_build_tour, check_required_fields }: { data_build_tour: data_build_tour, check_required_fields?: boolean }) {
  const router = useRouter()

  // Format date to YYYY-MM-DD for backend API
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${year}-${month}-${day}`
  }

  // Parse date string (dd/mm/yyyy or YYYY-MM-DD) to Date
  const parseDateStringToDate = (dateStr?: string | null): Date | null => {
    if (!dateStr) return null
    const trimmed = dateStr.trim()
    if (!trimmed) return null

    let day: number
    let month: number
    let year: number

    if (trimmed.includes('/')) {
      const [d, m, y] = trimmed.split('/')
      day = Number(d)
      month = Number(m)
      year = Number(y)
    } else if (trimmed.includes('-')) {
      const [y, m, d] = trimmed.split('-')
      day = Number(d)
      month = Number(m)
      year = Number(y)
    } else {
      return null
    }

    if (!day || !month || !year) return null
    return new Date(year, month - 1, day)
  }

  // Ưu tiên dùng ngày bay đã lưu, nếu chưa có thì dùng ngày chuyến đi
  const initialFlightDepartureDate = parseDateStringToDate(
    data_build_tour.flight_departure_date || data_build_tour.departureDate
  )
  const initialFlightReturnDate = parseDateStringToDate(
    data_build_tour.flight_return_date || data_build_tour.returnDate
  )

  const [departure, setDeparture] = useState<string | null>(data_build_tour.departure)
  const [destination, setDestination] = useState<string | null>(data_build_tour.destination)
  const [isLoading, setIsLoading] = useState(false)
  const [cities, setCities] = useState<City[]>([])
  const [flightDepartureDate, setFlightDepartureDate] = useState<Date | null>(initialFlightDepartureDate)
  const [flightReturnDate, setFlightReturnDate] = useState<Date | null>(initialFlightReturnDate)
  const [formattedFlightDepartureDate, setFormattedFlightDepartureDate] = useState<string>(
    initialFlightDepartureDate ? formatDate(initialFlightDepartureDate) : ''
  )
  const [formattedFlightReturnDate, setFormattedFlightReturnDate] = useState<string>(
    initialFlightReturnDate ? formatDate(initialFlightReturnDate) : ''
  )
  const [dataBuildTour, setDataBuildTour] = useState<data_build_tour>(data_build_tour)

  useEffect(() => {
    console.log('FlightsSearch data_build_tour:', data_build_tour)
  }, [data_build_tour])



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
  const handleSubmit = useCallback(() => {
    if (!departure || !destination || !flightDepartureDate || !flightReturnDate) {
      alert("Please fill all required fields")
      return
    }
    if (check_required_fields === true && (dataBuildTour.budget === 0 || dataBuildTour.adults === 0)) {
      alert("Please fill in all required fields and uncheck, then reselect to update. ")
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
    <div className="rounded-3xl border border-white/10 bg-white/3 p-8 backdrop-blur">
      <div className="mb-6">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#FFE5B4]">
          Flight Navigator
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Search flights for departure and destination
        </h3>
        <p className="mt-2 text-sm text-[#D0D7D8]">
          Find the best flight options connecting your journey endpoints with flexible schedules.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Departure <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={departure || ""}
              onChange={(e) => setDeparture(e.value)}
              options={cities.map((city) => ({
                label: city.city + ", " + city.country,
                value: city.city
              }))}
              optionLabel="label"
              optionValue="value"
              placeholder="Search departure..."
              filter
              showClear={false}
              className="dashboard-form__prime"
              panelClassName="dashboard-form__prime-panel"
            />
          </div>

          <div className="dashboard-form__field">
            <label className="dashboard-form__label">
              Destination <span className="text-red-400">*</span>
            </label>
            <Dropdown
              value={destination || ""}
              onChange={(e) => setDestination(e.value)}
              options={cities.map((city) => ({
                label: city.city + ", " + city.country,
                value: city.city
              }))}              optionLabel="label"
              optionValue="value"
              placeholder="Search destination..."
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
              Flight departure time <span className="text-red-400">*</span>
            </label>
            <Calendar
              placeholder={'Select departure date...'}
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
              Flight return time <span className="text-red-400">*</span>
            </label>
            <Calendar
              placeholder={'Select return date...'}
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
            "Search flights"
          )}
        </button>
      </div>
    </div>
  )
}


"use client"

import React, { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Dropdown } from 'primereact/dropdown'
import { Calendar } from 'primereact/calendar'
import { NumericFormat } from 'react-number-format'
import { InputText } from 'primereact/inputtext'
import { City, data_build_tour } from "@/types/domain"
import { api } from "@/lib/axios"
import { TravelService } from "@/services/travel.service"
import FlightsSearch from "@/components/dashboard/flights-search"
import { CityService } from "@/services/city.service"
import { useRouter } from "next/navigation"
import { Checkbox } from 'primereact/checkbox';
import { toast } from "@/lib/toast"

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(" ")
}

function useOnClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return
      }
      handler()
    }

    document.addEventListener("mousedown", listener)
    document.addEventListener("touchstart", listener)

    return () => {
      document.removeEventListener("mousedown", listener)
      document.removeEventListener("touchstart", listener)
    }
  }, [ref, handler])
}

export default function JourneyBuilder() {
  const router = useRouter()
  const [isIncludeFlight, setIsIncludeFlight] = useState(false)

  const [isGuestOpen, setIsGuestOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const guestCounterRef = useRef<HTMLDivElement>(null)
  const [dates, setDates] = useState<any>(null)
  const [cities, setCities] = useState<City[]>([])

  const [dataBuildTour, setDataBuildTour] = useState<data_build_tour>({
    departure: "",
    destination: "",
    departureDate: "",
    returnDate: "",
    days: 0,
    budget: 0,
    adults: 0,
    children: 0,
    infants: 0,
    bookflight: false,
    flight_departure: null,
    flight_return: null,
    flight_departure_date: null,
    flight_return_date: null,
    departure_city_id: "",
    destination_city_id: "",
  })

  useOnClickOutside(guestCounterRef, () => setIsGuestOpen(false))

  // Format date to dd/mm/yyyy
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

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

  const calculateDays = useCallback(() => {
    if (!dataBuildTour.departureDate || !dataBuildTour.returnDate) {
      return 0
    }

    // Parse dd/mm/yyyy format
    const parseDateString = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('/').map(Number)
      return new Date(year, month - 1, day)
    }

    const departureDate = parseDateString(dataBuildTour.departureDate)
    const returnDate = parseDateString(dataBuildTour.returnDate)

    return Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }, [dataBuildTour.departureDate, dataBuildTour.returnDate])

  // Guest label renderer
  const renderGuestLabel = useCallback(() => {
    const totalGuests = dataBuildTour.adults + dataBuildTour.children
    const numInfants = dataBuildTour.infants

    if (totalGuests === 0 && numInfants === 0) {
      return "Add guests"
    }

    const guestLabel = `${totalGuests} ${totalGuests > 1 ? "guests" : "guest"}`
    const infantLabel = numInfants > 0 ? `, ${numInfants} ${numInfants > 1 ? "infants" : "infant"}` : ""

    return `${guestLabel}${infantLabel}`
  }, [dataBuildTour.adults, dataBuildTour.children, dataBuildTour.infants])

  const renderBudget = useCallback(() => {
    return dataBuildTour.budget.toLocaleString('en-US')
  }, [dataBuildTour.budget])

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    const missing: string[] = []
    if (!dataBuildTour.departure) missing.push('Điểm xuất phát')
    if (!dataBuildTour.destination) missing.push('Điểm đến')
    if (!dataBuildTour.departureDate) missing.push('Ngày đi')
    if (!dataBuildTour.returnDate) missing.push('Ngày về')
    if (!dataBuildTour.budget) missing.push('Ngân sách')
    if (dataBuildTour.adults === 0) missing.push('Số khách (ít nhất 1 người lớn)')

    if (missing.length > 0) {
      toast.warning(`Vui lòng điền đầy đủ: ${missing.join(', ')}.`, 'Thiếu thông tin')
      return
    }

    // Tạo object mới với days đã tính
    const updatedData = { ...dataBuildTour, days: calculateDays() }
    console.log("dataBuildTour (after - with days)", updatedData)

    setDataBuildTour(updatedData)

    // Save trip data to localStorage for preferences page
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentTripData', JSON.stringify(updatedData))
    }

    // setIsLoading(true)

    // Pass destination city ID to preferences page
    router.push(`/preferences?cityId=${dataBuildTour.destination_city_id}`)

  }, [dataBuildTour, calculateDays, router])

  const button_submit = () => {
    return (
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className={cn(
          "h-12 w-full rounded-xl border border-[#3DA8A0] bg-[#3DA8A0] text-sm font-semibold text-white transition-all",
          isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-[1.02]"
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
          "Build itinerary"
        )}
      </button>
    )
  }
  return (
    <div>
      {/* Decorative halo effect */}

      <div className="rounded-3xl  bg-white/3 p-8 backdrop-blur travel-search__inner">
        {/* Header */}
        <header className="travel-search__header">
          <span className="travel-search__tag">Curated Journey Builder</span>
          <h1 className="travel-search__title">Craft your signature journey</h1>
          <p className="travel-search__subtitle">
            Define routes, travel window and investment so we can choreograph a bespoke escape in your style.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Card 1: Route & Schedule */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur travel-search__card">
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#5FCBC4]">
                Chapter 01
              </p>
              <h3 className="text-2xl font-semibold text-[#8bbcb7]">
                Route & preferred schedule
              </h3>
              <p className="mt-2 text-sm text-[#486c68]">
                We connect every crafted stop while balancing each moment across your stay.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="travel-search__field dashboard-form__field">
                  <label className="dashboard-form__label">
                    Departure <span className="text-red-400">*</span>
                  </label>
                  <Dropdown
                    value={dataBuildTour.departure}
                    onChange={(e) => {
                      const selectedCity = cities.find((city) => city.city === e.value)
                      setDataBuildTour({
                        ...dataBuildTour,
                        departure: e.value,
                        departure_city_id: selectedCity?.id || ""
                      })
                    }}
                    options={cities.map((city) => ({
                      label: city.city + ", " + city.country,
                      value: city.city
                    }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={'Search departure...'}
                    filter
                    showClear={false}
                    className="dashboard-form__prime"
                    panelClassName="dashboard-form__prime-panel"
                  />
                </div>
                <div className="travel-search__field dashboard-form__field">
                  <label className="dashboard-form__label">
                    Destination <span className="text-red-400">*</span>
                  </label>
                  <Dropdown
                    value={dataBuildTour.destination}
                    onChange={(e) => {
                      const selectedCity = cities.find((city) => city.city === e.value)
                      setDataBuildTour({
                        ...dataBuildTour,
                        destination: e.value,
                        destination_city_id: selectedCity?.id || ""
                      })
                    }}
                    options={cities.map((city) => ({
                      label: city.city + ", " + city.country,
                      value: city.city
                    }))}
                    optionLabel="label"
                    optionValue="value"
                    placeholder={'Search destination...'}
                    filter
                    showClear={false}
                    className="dashboard-form__prime"
                    panelClassName="dashboard-form__prime-panel"
                  />
                </div>
              </div>

              <div className="grid gap-5 w-full">
                <div className="travel-search__field dashboard-form__field">
                  <label className="dashboard-form__label">
                    Departure date <span className="text-red-400">*</span>
                  </label>
                  <Calendar
                    placeholder={'Select your date range...'}
                    selectionMode="range"
                    value={dates}
                    onChange={(event) => {
                      const selectedDates = event.value as any
                      setDates(selectedDates)

                      // Format and store dates as dd/mm/yyyy
                      if (selectedDates && Array.isArray(selectedDates)) {
                        if (selectedDates[0]) {
                          const formattedDepartureDate = formatDate(selectedDates[0])
                          console.log('Formatted Departure Date:', formattedDepartureDate)
                          setDataBuildTour(prev => ({ ...prev, departureDate: formattedDepartureDate }))
                        }
                        if (selectedDates[1]) {
                          const formattedReturnDate = formatDate(selectedDates[1])
                          console.log('Formatted Return Date:', formattedReturnDate)
                          setDataBuildTour(prev => ({ ...prev, returnDate: formattedReturnDate }))
                        }
                      }
                    }}
                    readOnlyInput
                    hideOnRangeSelection
                    dateFormat="dd/mm/yy"
                    minDate={new Date(new Date().setDate(new Date().getDate() + 1))}
                    appendTo="self"
                    className="dashboard-form__prime"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox inputId="checkbox_flight" checked={isIncludeFlight} onChange={() => setIsIncludeFlight(!isIncludeFlight)} />
                <label htmlFor="checkbox_flight" className="text-[#3DA8A0]">You want to include flights in your journey?</label>
              </div>
            </div>
          </div>

          {/* Card 2: Budget & Travelers */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur travel-search__card">
            <div className="mb-6">
              <p className="mb-2 text-xs uppercase tracking-[0.3em] text-[#5FCBC4]">
                Chapter 02
              </p>
              <h3 className="text-2xl font-semibold text-[#8bbcb7]">
                Investment & travel party
              </h3>
              <p className="mt-2 text-sm text-[#486c68]">
                Refine the planned investment and company so every service feels personal.
              </p>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="travel-search__field dashboard-form__field">
                  <label className="dashboard-form__label">
                    Preferred budget <span className="text-red-400">*</span>
                  </label>
                  <NumericFormat
                    customInput={InputText}
                    className="dashboard-form__prime"
                    style={{ color: '#3DA8A0' }}
                    placeholder={'Enter your budget...'}
                    value={dataBuildTour.budget || ''}
                    onValueChange={(values: any) => {
                      setDataBuildTour({ ...dataBuildTour, budget: values.floatValue || 0 })
                    }}
                    thousandSeparator={','}
                    decimalSeparator={'.'}
                    suffix={' $'}
                    maxLength={10}
                    allowNegative={false}
                  />
                </div>
                <div className="travel-search__field dashboard-form__field">
                  <label className="dashboard-form__label">
                    Travelers <span className="text-red-400">*</span>
                  </label>
                  <div className="guest-selector" ref={guestCounterRef}>
                    <button
                      type="button"
                      onClick={() => setIsGuestOpen(!isGuestOpen)}
                      className="guest-selector__trigger"
                    >
                      <span className={dataBuildTour.adults + dataBuildTour.children === 0 ? "text-[#94A3B8]" : "text-[#3DA8A0]"}>
                        {renderGuestLabel()}
                      </span>
                      <svg
                        className={cn("h-4 w-4 transition-transform", isGuestOpen && "rotate-180")}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isGuestOpen && (
                      <div className="guest-counter-panel">
                        {/* Adults */}
                        <div className="counter-row">
                          <div className="counter-label">
                            <strong>Adults</strong>
                            <span>12+ years</span>
                          </div>
                          <div className="counter-buttons">
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, adults: Math.max(0, dataBuildTour.adults - 1) })}
                              disabled={dataBuildTour.adults === 0}
                            >
                              −
                            </button>
                            <span>{dataBuildTour.adults}</span>
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, adults: dataBuildTour.adults + 1 })}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="counter-row">
                          <div className="counter-label">
                            <strong>Children</strong>
                            <span>2-11 years</span>
                          </div>
                          <div className="counter-buttons">
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, children: Math.max(0, dataBuildTour.children - 1) })}
                              disabled={dataBuildTour.children === 0}
                            >
                              −
                            </button>
                            <span>{dataBuildTour.children}</span>
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, children: dataBuildTour.children + 1 })}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Infants */}
                        <div className="counter-row">
                          <div className="counter-label">
                            <strong>Infants</strong>
                            <span>Under 2 years</span>
                          </div>
                          <div className="counter-buttons">
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, infants: Math.max(0, dataBuildTour.infants - 1) })}
                              disabled={dataBuildTour.infants === 0}
                            >
                              −
                            </button>
                            <span>{dataBuildTour.infants}</span>
                            <button
                              onClick={() => setDataBuildTour({ ...dataBuildTour, infants: dataBuildTour.infants + 1 })}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <button
                          onClick={() => setIsGuestOpen(false)}
                          className="done-button"
                        >
                          Done
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="travel-search__meta">
                <div>
                  <span className="travel-search__meta-label">Time frame</span>
                  <div className="travel-search__meta-value">{calculateDays()}</div>
                </div>

                <div>
                  <span className="travel-search__meta-label">Travel party</span>
                  <div className="travel-search__meta-value">{renderGuestLabel()}</div>
                </div>

                <div>
                  <span className="travel-search__meta-label">Planned budget</span>
                  <div className="travel-search__meta-value">{renderBudget()}$</div>
                </div>
              </div>
              <>
                {isIncludeFlight ? null : button_submit()}
              </>
            </div>
          </div>
        </div>
        <>
          {isIncludeFlight ? <FlightsSearch data_build_tour={dataBuildTour} /> : null}
          {/* <FlightsSearch /> */}
        </>
      </div>
    </div>
  )
}


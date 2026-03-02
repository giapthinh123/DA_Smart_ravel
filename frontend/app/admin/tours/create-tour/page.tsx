'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    MapPin,
    Search,
    Plus,
    X,
    Star,
    DollarSign,
    Hotel,
    Utensils,
    Landmark,
    Clock,
    CalendarDays,
    ChevronDown,
    ChevronUp,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Globe,
    Tag,
    ArrowLeft,
} from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CityService } from '@/services/city.service'
import { PlacesService } from '@/services/places.service'
import { TourService, TourCreatePayload, TourActivityInput, TourDayInput } from '@/services/tour.service'
import { City, Place } from '@/types/domain'

// ─── Local types ──────────────────────────────────────────────────────────────

interface DayState {
    day_number: number
    theme: string
    activities: ActivityState[]
}

interface ActivityState {
    id: string // local-only key for React
    place_id: string
    place_name: string
    place_type: 'attraction' | 'restaurant' | 'hotel'
    time: string
    duration_hours: number
    meal: '' | 'breakfast' | 'lunch' | 'dinner'
}

interface PricingState {
    accommodation: number
    activities: number
    transportation: number
    misc: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9)

const MEAL_OPTIONS = [
    { value: '', label: 'Không chọn' },
    { value: 'breakfast', label: 'Bữa sáng' },
    { value: 'lunch', label: 'Bữa trưa' },
    { value: 'dinner', label: 'Bữa tối' },
]

function getTypeBadgeClass(type: string) {
    switch (type) {
        case 'restaurant': return 'bg-orange-100 text-orange-700'
        case 'hotel': return 'bg-purple-100 text-purple-700'
        case 'attraction': return 'bg-green-100 text-green-700'
        default: return 'bg-gray-100 text-gray-700'
    }
}

function getTypeLabel(type: string) {
    switch (type) {
        case 'restaurant': return 'Nhà hàng'
        case 'hotel': return 'Khách sạn'
        case 'attraction': return 'Điểm tham quan'
        default: return type
    }
}

function getTypeIcon(type: string) {
    switch (type) {
        case 'restaurant': return <Utensils className="h-3.5 w-3.5" />
        case 'hotel': return <Hotel className="h-3.5 w-3.5" />
        default: return <Landmark className="h-3.5 w-3.5" />
    }
}

// ─── Place Picker Modal ────────────────────────────────────────────────────────

interface PlacePickerProps {
    places: Place[]
    allowedTypes?: Array<'hotel' | 'restaurant' | 'attraction'>
    onSelect: (place: Place) => void
    onClose: () => void
}

function PlacePickerModal({ places, allowedTypes, onSelect, onClose }: PlacePickerProps) {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState<string>('all')

    const filtered = places.filter(p => {
        const matchType = allowedTypes
            ? allowedTypes.includes(p.search_type as 'hotel' | 'restaurant' | 'attraction')
            : true
        const matchFilter = typeFilter === 'all' || p.search_type === typeFilter
        const matchSearch = p.displayName_text.toLowerCase().includes(search.toLowerCase())
        return matchType && matchFilter && matchSearch
    })

    const types = allowedTypes ?? ['hotel', 'restaurant', 'attraction']

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Chọn địa điểm</h3>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Search + filter */}
                <div className="p-4 space-y-3 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm địa điểm..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setTypeFilter('all')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Tất cả
                        </button>
                        {types.map(t => (
                            <button
                                key={t}
                                onClick={() => setTypeFilter(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {getTypeLabel(t)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Place list */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filtered.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Không tìm thấy địa điểm</p>
                        </div>
                    ) : (
                        filtered.map(place => (
                            <button
                                key={place.id}
                                onClick={() => onSelect(place)}
                                className="w-full text-left flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all group"
                            >
                                <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                                    {getTypeIcon(place.search_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                        {place.displayName_text}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${getTypeBadgeClass(place.search_type)}`}>
                                            {getTypeIcon(place.search_type)}
                                            {getTypeLabel(place.search_type)}
                                        </span>
                                        {place.rating > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                {place.rating.toFixed(1)}
                                            </span>
                                        )}
                                        {place.avg_price > 0 && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <DollarSign className="h-3 w-3" />
                                                {place.avg_price.toFixed(0)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

function TourManagementPage() {
    const router = useRouter()
    // City & places data
    const [cities, setCities] = useState<City[]>([])
    const [categorizedPlaces, setCategorizedPlaces] = useState<{
        hotel: Place[]
        restaurant: Place[]
        attraction: Place[]
    }>({ hotel: [], restaurant: [], attraction: [] })
    const [loadingCities, setLoadingCities] = useState(true)
    const [loadingPlaces, setLoadingPlaces] = useState(false)

    // Selected city_id for filtering
    const [selectedCityId, setSelectedCityId] = useState('')

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [destCity, setDestCity] = useState('')
    const [destCountry, setDestCountry] = useState('')
    const [durationDays, setDurationDays] = useState(1)
    const [durationDaysInput, setDurationDaysInput] = useState('1')
    const [hotelId, setHotelId] = useState('')
    const [hotelName, setHotelName] = useState('')
    const [days, setDays] = useState<DayState[]>([
        { day_number: 1, theme: '', activities: [] }
    ])
    const [pricing, setPricing] = useState<PricingState>({
        accommodation: 0,
        activities: 0,
        transportation: 0,
        misc: 0,
    })

    const handleDurationDaysChange = (value: string) => {
        setDurationDaysInput(value)
        if (value === '') {
            return
        }
        if (!/^\d+$/.test(value)) {
            return
        }
        const num = parseInt(value, 10)
        if (num < 1) {
            return
        }
        if (num > 20) {
            return
        }
        setDurationDays(num)
    }

    // UI state
    const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set())
    const [pickerDayIndex, setPickerDayIndex] = useState<number | null>(null)
    const [hotelPickerOpen, setHotelPickerOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Derived
    const allPlaces = [
        ...categorizedPlaces.hotel,
        ...categorizedPlaces.restaurant,
        ...categorizedPlaces.attraction,
    ]
    const pricingTotal = pricing.accommodation + pricing.activities + pricing.transportation + pricing.misc

    // ── Fetch cities ────────────────────────────────────────────────────────────
    useEffect(() => {
        CityService.getCities()
            .then(setCities)
            .catch(console.error)
            .finally(() => setLoadingCities(false))
    }, [])

    // ── Fetch places when city changes ──────────────────────────────────────────
    useEffect(() => {
        if (!selectedCityId) {
            setCategorizedPlaces({ hotel: [], restaurant: [], attraction: [] })
            return
        }
        setLoadingPlaces(true)
        PlacesService.getPlacesByCityId(selectedCityId)
            .then(setCategorizedPlaces)
            .catch(console.error)
            .finally(() => setLoadingPlaces(false))
    }, [selectedCityId])

    // ── Sync days array length with durationDays ────────────────────────────────
    useEffect(() => {
        setDays(prev => {
            const next = [...prev]
            while (next.length < durationDays) {
                next.push({ day_number: next.length + 1, theme: '', activities: [] })
            }
            return next.slice(0, durationDays)
        })
    }, [durationDays])

    // ── City selection handler ──────────────────────────────────────────────────
    const handleCityChange = (cityName: string) => {
        const city = cities.find(c => c.city === cityName)
        setDestCity(cityName)
        setSelectedCityId(city?.id ?? '')
        // Reset hotel when city changes
        setHotelId('')
        setHotelName('')
    }

    // ── Day helpers ─────────────────────────────────────────────────────────────
    const updateDay = (idx: number, patch: Partial<DayState>) => {
        setDays(prev => prev.map((d, i) => i === idx ? { ...d, ...patch } : d))
    }

    const toggleDayCollapse = (idx: number) => {
        setCollapsedDays(prev => {
            const next = new Set(prev)
            next.has(idx) ? next.delete(idx) : next.add(idx)
            return next
        })
    }

    // ── Activity helpers ────────────────────────────────────────────────────────
    const addActivity = (dayIdx: number, place: Place) => {
        const act: ActivityState = {
            id: uid(),
            place_id: place.id,
            place_name: place.displayName_text,
            place_type: place.search_type as 'attraction' | 'restaurant' | 'hotel',
            time: '09:00',
            duration_hours: 1.5,
            meal: '',
        }
        updateDay(dayIdx, {
            activities: [...days[dayIdx].activities, act]
        })
        setPickerDayIndex(null)
    }

    const updateActivity = (dayIdx: number, actId: string, patch: Partial<ActivityState>) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== dayIdx) return d
            return {
                ...d,
                activities: d.activities.map(a => a.id === actId ? { ...a, ...patch } : a)
            }
        }))
    }

    const removeActivity = (dayIdx: number, actId: string) => {
        setDays(prev => prev.map((d, i) => {
            if (i !== dayIdx) return d
            return { ...d, activities: d.activities.filter(a => a.id !== actId) }
        }))
    }

    // ── Pricing handler ─────────────────────────────────────────────────────────
    const updatePricing = (field: keyof PricingState, value: number) => {
        setPricing(prev => ({ ...prev, [field]: value }))
    }

    // ── Reset form ──────────────────────────────────────────────────────────────
    const resetForm = () => {
        setTitle('')
        setDescription('')
        setDestCity('')
        setDestCountry('')
        setDurationDays(1)
        setHotelId('')
        setHotelName('')
        setDays([{ day_number: 1, theme: '', activities: [] }])
        setPricing({ accommodation: 0, activities: 0, transportation: 0, misc: 0 })
        setSelectedCityId('')
        setCollapsedDays(new Set())
    }

    // ── Submit ──────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setErrorMessage('')
        setSuccessMessage('')

        if (!title.trim()) { setErrorMessage('Vui lòng nhập tiêu đề tour.'); return }
        if (!destCity.trim()) { setErrorMessage('Vui lòng chọn thành phố.'); return }
        if (!hotelId) { setErrorMessage('Vui lòng chọn khách sạn.'); return }

        const payload: TourCreatePayload = {
            title: title.trim(),
            description: description.trim(),
            destination: { city: destCity, country: destCountry },
            duration_days: durationDays,
            accommodation: { hotel_id: hotelId },
            itinerary: days.map<TourDayInput>(d => ({
                day_number: d.day_number,
                theme: d.theme,
                activities: d.activities.map<TourActivityInput>(a => ({
                    place_id: a.place_id,
                    time: a.time,
                    duration_hours: a.duration_hours,
                    ...(a.place_type === 'restaurant' && a.meal ? { meal: a.meal as TourActivityInput['meal'] } : {}),
                })),
            })),
            pricing: {
                accommodation: pricing.accommodation,
                activities: pricing.activities,
                transportation: pricing.transportation,
                misc: pricing.misc,
                total: pricingTotal,
            },
        }

        setSubmitting(true)
        try {
            await TourService.createTour(payload)
            setSuccessMessage('Tour đã được tạo thành công!')
            resetForm()
            setTimeout(() => router.push('/admin/tours'), 1200)
        } catch (err: any) {
            setErrorMessage(err.message ?? 'Tạo tour thất bại.')
        } finally {
            setSubmitting(false)
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    return (
        <AdminLayout title="Tạo tour mới" description="Điền thông tin để tạo một tour du lịch mới">

            {/* Back button */}
            <button
                onClick={() => router.push('/admin/tours')}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-6 group"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                Quay lại danh sách tour
            </button>

            {/* ── Status messages ── */}
            {successMessage && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{successMessage}</span>
                    <button onClick={() => setSuccessMessage('')} className="ml-auto"><X className="h-4 w-4" /></button>
                </div>
            )}
            {errorMessage && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                    <button onClick={() => setErrorMessage('')} className="ml-auto"><X className="h-4 w-4" /></button>
                </div>
            )}

            <div className="space-y-6 max-w-5xl">

                {/* ══ Section A: Thông tin cơ bản ══════════════════════════════ */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">A</div>
                            Thông tin cơ bản
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Tiêu đề tour <span className="text-red-500">*</span>
                            </label>
                            <Input
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="VD: Tour 4 ngày khám phá Macau"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Mô tả
                            </label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={3}
                                placeholder="Mô tả ngắn về tour..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* City */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Thành phố <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <select
                                        value={destCity}
                                        onChange={e => handleCityChange(e.target.value)}
                                        disabled={loadingCities}
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                                    >
                                        <option value="">— Chọn thành phố —</option>
                                        {cities.map(c => (
                                            <option key={c.id} value={c.city}>{c.city}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Country */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Quốc gia
                                </label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        value={destCountry}
                                        onChange={e => setDestCountry(e.target.value)}
                                        placeholder="VD: Vietnam"
                                        className="pl-9"
                                    />
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Số ngày <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <Input
                                        type="text"
                                        value={durationDaysInput}
                                        onChange={e => handleDurationDaysChange(e.target.value)}
                                        className="pl-9"
                                        placeholder="1 - 20"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ══ Section B: Chỗ ở ══════════════════════════════════════════ */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-xs font-bold">B</div>
                            Chỗ ở (Khách sạn)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedCityId ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                                <MapPin className="h-4 w-4" />
                                Vui lòng chọn thành phố trước để hiển thị danh sách khách sạn.
                            </div>
                        ) : loadingPlaces ? (
                            <div className="flex items-center gap-2 py-4 text-sm text-gray-400">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tải danh sách khách sạn...
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {hotelId ? (
                                    /* Selected hotel display */
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-200">
                                        <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                                            <Hotel className="h-4 w-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900">{hotelName}</p>
                                            <p className="text-xs text-gray-500 font-mono truncate">{hotelId}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setHotelId(''); setHotelName('') }}
                                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        variant="outline"
                                        onClick={() => setHotelPickerOpen(true)}
                                        className="gap-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Chọn khách sạn
                                    </Button>
                                )}

                                {categorizedPlaces.hotel.length === 0 && (
                                    <p className="text-xs text-gray-400">
                                        Không có khách sạn nào trong thành phố này.
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ══ Section C: Lịch trình ══════════════════════════════════════ */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">C</div>
                            Lịch trình ({durationDays} ngày)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {days.map((day, dayIdx) => {
                            const isCollapsed = collapsedDays.has(dayIdx)
                            return (
                                <div
                                    key={day.day_number}
                                    className="border border-gray-200 rounded-xl overflow-hidden"
                                >
                                    {/* Day header */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none"
                                        onClick={() => toggleDayCollapse(dayIdx)}
                                    >
                                        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold shrink-0">
                                            {day.day_number}
                                        </div>
                                        <span className="text-sm font-semibold text-gray-800 flex-1">
                                            Ngày {day.day_number}
                                            {day.theme ? ` — ${day.theme}` : ''}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {day.activities.length} hoạt động
                                        </span>
                                        {isCollapsed
                                            ? <ChevronDown className="h-4 w-4 text-gray-400" />
                                            : <ChevronUp className="h-4 w-4 text-gray-400" />
                                        }
                                    </div>

                                    {/* Day body */}
                                    {!isCollapsed && (
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Chủ đề</label>
                                                <div className="relative">
                                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                                    <Input
                                                        value={day.theme}
                                                        onChange={e => updateDay(dayIdx, { theme: e.target.value })}
                                                        placeholder="VD: Khám phá văn hóa"
                                                        className="pl-8 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {/* Activities */}
                                            {day.activities.length > 0 && (
                                                <div className="space-y-2">
                                                    {day.activities.map(act => (
                                                        <div
                                                            key={act.id}
                                                            className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-gray-50 border border-gray-100"
                                                        >
                                                            {/* Place chip */}
                                                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeClass(act.place_type)}`}>
                                                                {getTypeIcon(act.place_type)}
                                                                <span className="max-w-[160px] truncate">{act.place_name}</span>
                                                            </div>

                                                            {/* Time */}
                                                            <div className="flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                                <input
                                                                    type="time"
                                                                    value={act.time}
                                                                    onChange={e => updateActivity(dayIdx, act.id, { time: e.target.value })}
                                                                    className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                            </div>

                                                            {/* Duration */}
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-xs text-gray-500">Thời lượng:</span>
                                                                <input
                                                                    type="number"
                                                                    min={0.5}
                                                                    max={12}
                                                                    step={0.5}
                                                                    value={act.duration_hours}
                                                                    onChange={e => updateActivity(dayIdx, act.id, { duration_hours: parseFloat(e.target.value) || 1 })}
                                                                    className="w-16 text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                />
                                                                <span className="text-xs text-gray-400">h</span>
                                                            </div>

                                                            {/* Meal (only for restaurants) */}
                                                            {act.place_type === 'restaurant' && (
                                                                <select
                                                                    value={act.meal}
                                                                    onChange={e => updateActivity(dayIdx, act.id, { meal: e.target.value as ActivityState['meal'] })}
                                                                    className="text-xs px-2 py-1 rounded border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                                >
                                                                    {MEAL_OPTIONS.map(o => (
                                                                        <option key={o.value} value={o.value}>{o.label}</option>
                                                                    ))}
                                                                </select>
                                                            )}

                                                            {/* Remove */}
                                                            <button
                                                                onClick={() => removeActivity(dayIdx, act.id)}
                                                                className="ml-auto p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Add activity button */}
                                            {selectedCityId ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPickerDayIndex(dayIdx)}
                                                    disabled={loadingPlaces}
                                                    className="gap-2 border-dashed border-green-300 text-green-600 hover:bg-green-50"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                    Thêm hoạt động
                                                </Button>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">
                                                    Chọn thành phố ở mục A để thêm hoạt động.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* ══ Section D: Chi phí ════════════════════════════════════════ */}
                <Card className="border border-gray-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 text-xs font-bold">D</div>
                            Chi phí (USD)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {(
                                [
                                    { key: 'accommodation', label: 'Lưu trú' },
                                    { key: 'activities', label: 'Hoạt động' },
                                    { key: 'transportation', label: 'Di chuyển' },
                                    { key: 'misc', label: 'Khác' },
                                ] as { key: keyof PricingState; label: string }[]
                            ).map(({ key, label }) => (
                                <div key={key}>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                                        <Input
                                            type="number"
                                            min={0}
                                            value={pricing[key]}
                                            onChange={e => updatePricing(key, parseFloat(e.target.value) || 0)}
                                            className="pl-8 text-sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-blue-50 border border-blue-200">
                            <span className="text-sm font-semibold text-gray-700">Tổng chi phí</span>
                            <div className="flex items-center gap-1 text-lg font-bold text-blue-600">
                                <DollarSign className="h-4 w-4" />
                                {pricingTotal.toLocaleString()}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* ══ Submit button ═════════════════════════════════════════════ */}
                <div className="flex justify-end gap-3 pb-8">
                    <Button variant="outline" onClick={resetForm} disabled={submitting}>
                        Đặt lại
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                Tạo Tour
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* ══ Hotel Picker Modal ════════════════════════════════════════════ */}
            {hotelPickerOpen && (
                <PlacePickerModal
                    places={categorizedPlaces.hotel}
                    allowedTypes={['hotel']}
                    onSelect={place => {
                        setHotelId(place.id)
                        setHotelName(place.displayName_text)
                        setHotelPickerOpen(false)
                    }}
                    onClose={() => setHotelPickerOpen(false)}
                />
            )}

            {/* ══ Activity Picker Modal ═════════════════════════════════════════ */}
            {pickerDayIndex !== null && (
                <PlacePickerModal
                    places={[...categorizedPlaces.attraction, ...categorizedPlaces.restaurant]}
                    allowedTypes={['attraction', 'restaurant']}
                    onSelect={place => addActivity(pickerDayIndex, place)}
                    onClose={() => setPickerDayIndex(null)}
                />
            )}
        </AdminLayout>
    )
}

export default TourManagementPage

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
    Image as ImageIcon,
    Trash2,
    Star,
    DollarSign,
    Globe,
    Tag,
    FileText,
    MapPinned,
    Calendar,
    Filter,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Pencil,
    MoreHorizontal
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CityService } from '@/services/city.service'
import { City } from '@/types/domain'
import { PlacesService } from '@/services/places.service'
import { Place } from '@/types/domain'
import { ImageUploader, ImageUploaderHandle } from '@/components/ui/image-uploader'
import { toast } from '@/lib/toast'
// Location type definition based on the provided schema
interface Location {
    _id?: { $oid: string }
    id: string
    city: string
    city_id: string
    displayName_text: string
    editorialSummary_text: string
    location: {
        latitude: number
        longitude: number
    }
    rating: number
    types: string[]
    avg_price: number
    search_type: string
    filtered_at?: { $date: string }
    filter_criteria?: string
    image_url: string[]
}

// Available search types
const SEARCH_TYPES = [
    { value: 'restaurant', label: 'Nhà hàng' },
    { value: 'hotel', label: 'Khách sạn' },
    { value: 'attraction', label: 'Điểm tham quan' },
]

/**
 * Location Management Page - Admin Only
 * Features: Create, list locations with full form fields
 */
function LocationManagementPage() {
    // ImageUploader refs (to call uploadAll on save)
    const createUploaderRef = useRef<ImageUploaderHandle>(null)
    const editUploaderRef = useRef<ImageUploaderHandle>(null)

    // City data
    const [cities, setCities] = useState<City[]>([])
    const [loadingCities, setLoadingCities] = useState(true)
    const [places, setPlaces] = useState<Place[]>([])
    const [loadingPlaces, setLoadingPlaces] = useState(true)

    // Search & filter
    const [searchQuery, setSearchQuery] = useState('')
    const [filterType, setFilterType] = useState<string>('all')

    // Pagination
    const ITEMS_PER_PAGE = 10
    const [currentPage, setCurrentPage] = useState(1)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Edit modal
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null)
    const [editLoading, setEditLoading] = useState(false)

    // Delete modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deletingPlace, setDeletingPlace] = useState<Place | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Edit form data (separate from create form)
    const [editFormData, setEditFormData] = useState<Omit<Location, '_id'>>({
        id: '',
        city: '',
        city_id: '',
        displayName_text: '',
        editorialSummary_text: '',
        location: { latitude: 0, longitude: 0 },
        rating: 0,
        types: [],
        avg_price: 0,
        search_type: 'restaurant',
        filter_criteria: '',
        image_url: []
    })
    // Create form data
    const [formData, setFormData] = useState<Omit<Location, '_id'>>({
        id: '',
        city: '',
        city_id: '',
        displayName_text: '',
        editorialSummary_text: '',
        location: {
            latitude: 0,
            longitude: 0
        },
        rating: 0,
        types: [],
        avg_price: 0,
        search_type: 'restaurant',
        filter_criteria: '',
        image_url: []
    })

    // Fetch cities on mount
    useEffect(() => {
        fetchCities()
        fetchPlace()
    }, [])

    const fetchCities = async () => {
        try {
            setLoadingCities(true)
            const data = await CityService.getCities()
            setCities(data)
        } catch (err) {
            console.error('Failed to load cities:', err)
        } finally {
            setLoadingCities(false)
        }
    }

    const fetchPlace = async () => {
        try {
            setLoadingPlaces(true)
            const data = await PlacesService.getAllPlaces()
            setPlaces(data.place)
        } catch (err) {
            console.error('Failed to load places:', err)
        } finally {
            setLoadingPlaces(false)
        }
    }

    // Filtered & paginated places
    const filteredPlaces = places.filter(p => {
        const matchSearch = p.displayName_text.toLowerCase().includes(searchQuery.toLowerCase())
        const matchType = filterType === 'all' || p.search_type === filterType
        return matchSearch && matchType
    })

    const totalPages = Math.max(1, Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE))
    const paginatedPlaces = filteredPlaces.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const handleFilterChange = (value: string) => {
        setFilterType(value)
        setCurrentPage(1)
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'restaurant': return 'Nhà hàng'
            case 'hotel': return 'Khách sạn'
            case 'attraction': return 'Điểm tham quan'
            default: return type
        }
    }

    const getTypeBadgeClass = (type: string) => {
        switch (type) {
            case 'restaurant': return 'bg-orange-100 text-orange-700'
            case 'hotel': return 'bg-purple-100 text-purple-700'
            case 'attraction': return 'bg-green-100 text-green-700'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    // Handle city selection
    const handleCityChange = (cityName: string) => {
        const selectedCity = cities.find(c => c.city === cityName)
        if (selectedCity) {
            setFormData({
                ...formData,
                city: selectedCity.city,
                city_id: selectedCity.id
            })
        }
    }

    // Handle type selection
    const handleTypeToggle = (type: string) => {
        const currentTypes = formData.types
        if (currentTypes.includes(type)) {
            setFormData({
                ...formData,
                types: currentTypes.filter(t => t !== type)
            })
        } else {
            setFormData({
                ...formData,
                types: [...currentTypes, type]
            })
        }
    }

    // Reset form
    const resetForm = () => {
        setFormData({
            id: '',
            city: '',
            city_id: '',
            displayName_text: '',
            editorialSummary_text: '',
            location: {
                latitude: 0,
                longitude: 0
            },
            rating: 0,
            types: [],
            avg_price: 0,
            search_type: 'restaurant',
            filter_criteria: '',
            image_url: []
        })
    }

    // Handle form submission
    const handleCreateLocation = async () => {
        try {
            setActionLoading(true)
            setErrorMessage('')

            if (!formData.city_id || !formData.displayName_text) {
                setErrorMessage('Vui lòng điền đầy đủ các trường bắt buộc (Thành phố, Tên)')
                return
            }

            // Upload pending images first
            let uploadedUrls: string[] = []
            if (createUploaderRef.current?.hasPending()) {
                try {
                    uploadedUrls = await createUploaderRef.current.uploadAll()
                } catch (err: any) {
                    setErrorMessage('Upload ảnh thất bại: ' + (err.message || ''))
                    return
                }
            }

            const allImages = [...formData.image_url.filter(u => u.trim()), ...uploadedUrls]

            const payload: Record<string, unknown> = {
                id: formData.id.trim() || undefined,
                city: formData.city,
                city_id: formData.city_id,
                displayName_text: formData.displayName_text,
                editorialSummary_text: formData.editorialSummary_text,
                location: formData.location,
                rating: formData.rating,
                avg_price: formData.avg_price,
                search_type: formData.search_type,
                types: formData.types,
                image_url: allImages,
                filter_criteria: formData.filter_criteria,
            }

            const newPlace = await PlacesService.createPlace(payload)
            setPlaces(prev => [newPlace, ...prev])

            setSuccessMessage('Tạo địa điểm thành công!')
            setTimeout(() => {
                setSuccessMessage('')
                setShowCreateModal(false)
                resetForm()
            }, 1500)

        } catch (err: any) {
            setErrorMessage(err.message || 'Không thể tạo địa điểm')
        } finally {
            setActionLoading(false)
        }
    }

    // Open edit modal: load full place details
    const handleOpenEdit = async (place: Place) => {
        setEditLoading(true)
        setShowEditModal(true)
        setEditingPlaceId(place.id)
        try {
            const detail = await PlacesService.getPlaceById(place.id)
            const city = cities.find(c => c.id === place.city_id)
            setEditFormData({
                id: place.id,
                city: city?.city ?? '',
                city_id: place.city_id ?? '',
                displayName_text: detail.displayName_text ?? place.displayName_text,
                editorialSummary_text: detail.editorialSummary_text ?? '',
                location: {
                    latitude: place.location?.latitude ?? 0,
                    longitude: place.location?.longitude ?? 0
                },
                rating: detail.rating ?? place.rating ?? 0,
                types: [],
                avg_price: detail.avg_price ?? place.avg_price ?? 0,
                search_type: place.search_type,
                filter_criteria: '',
                image_url: detail.image_url ?? []
            })
        } catch {
            setEditFormData({
                id: place.id,
                city: '',
                city_id: place.city_id ?? '',
                displayName_text: place.displayName_text,
                editorialSummary_text: '',
                location: { latitude: place.location?.latitude ?? 0, longitude: place.location?.longitude ?? 0 },
                rating: place.rating ?? 0,
                types: [],
                avg_price: place.avg_price ?? 0,
                search_type: place.search_type,
                filter_criteria: '',
                image_url: []
            })
        } finally {
            setEditLoading(false)
        }
    }

    // Save edit
    const handleUpdateLocation = async () => {
        if (!editingPlaceId) return
        try {
            setActionLoading(true)
            setErrorMessage('')
            if (!editFormData.displayName_text) {
                setErrorMessage('Vui lòng điền tên địa điểm')
                return
            }

            // Upload pending images first
            let uploadedUrls: string[] = []
            if (editUploaderRef.current?.hasPending()) {
                try {
                    uploadedUrls = await editUploaderRef.current.uploadAll()
                } catch (err: any) {
                    setErrorMessage('Upload ảnh thất bại: ' + (err.message || ''))
                    return
                }
            }

            const allImages = [...editFormData.image_url.filter(u => u), ...uploadedUrls]

            await PlacesService.updatePlace(editingPlaceId, {
                displayName_text: editFormData.displayName_text,
                editorialSummary_text: editFormData.editorialSummary_text,
                city: editFormData.city,
                city_id: editFormData.city_id,
                location: editFormData.location,
                avg_price: editFormData.avg_price,
                search_type: editFormData.search_type,
                image_url: allImages,
            })
            setPlaces(prev => prev.map(p =>
                p.id === editingPlaceId
                    ? { ...p, displayName_text: editFormData.displayName_text, avg_price: editFormData.avg_price, search_type: editFormData.search_type as Place['search_type'] }
                    : p
            ))
            setSuccessMessage('Cập nhật địa điểm thành công!')
            setTimeout(() => {
                setSuccessMessage('')
                setShowEditModal(false)
                setEditingPlaceId(null)
            }, 1500)
        } catch (err: any) {
            setErrorMessage(err.message || 'Không thể cập nhật địa điểm')
        } finally {
            setActionLoading(false)
        }
    }

    // Confirm delete
    const handleDeleteLocation = async () => {
        if (!deletingPlace) return
        try {
            setDeleteLoading(true)
            await PlacesService.deletePlace(deletingPlace.id)
            setPlaces(prev => prev.filter(p => p.id !== deletingPlace.id))
            setShowDeleteModal(false)
            setDeletingPlace(null)
        } catch (err: any) {
            toast.error(err.message || 'Không thể xóa địa điểm.', 'Lỗi xóa')
        } finally {
            setDeleteLoading(false)
        }
    }

    // City change for edit form
    const handleEditCityChange = (cityName: string) => {
        const selected = cities.find(c => c.city === cityName)
        if (selected) {
            setEditFormData({ ...editFormData, city: selected.city, city_id: selected.id })
        }
    }

    return (
        <AdminLayout title="Quản lý Địa điểm" description="Tạo và quản lý các địa điểm du lịch">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Tổng địa điểm</p>
                                <h3 className="text-3xl font-bold text-gray-900">{places.length}</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100">
                                <MapPin className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Nhà hàng</p>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {places.filter(p => p.search_type === 'restaurant').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-100">
                                <Globe className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Khách sạn</p>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {places.filter(p => p.search_type === 'hotel').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100">
                                <MapPinned className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Điểm tham quan</p>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    {places.filter(p => p.search_type === 'attraction').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100">
                                <Star className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <Card className="mb-6 bg-white border-gray-200">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Tìm kiếm địa điểm..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)}
                                    className="pl-10 bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Filter by type */}
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                value={filterType}
                                onChange={(e) => handleFilterChange(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">Tất cả loại</option>
                                {SEARCH_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Add Button */}
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm địa điểm
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Locations List */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-gray-900">
                            Danh sách địa điểm
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                            {filteredPlaces.length} địa điểm
                        </span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingPlaces ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="flex flex-col items-center gap-3">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
                            </div>
                        </div>
                    ) : paginatedPlaces.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                                <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-600 mb-2">
                                    {searchQuery || filterType !== 'all' ? 'Không tìm thấy địa điểm phù hợp' : 'Chưa có địa điểm nào'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {searchQuery || filterType !== 'all' ? 'Thử thay đổi từ khoá hoặc bộ lọc' : 'Bắt đầu bằng cách thêm địa điểm mới'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên địa điểm</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Đánh giá</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Giá TB ($)</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tọa độ</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">City Name</th>
                                            <th className="text-right py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedPlaces.map((place, idx) => (
                                            <tr
                                                key={place.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="py-3 px-4 text-sm text-gray-500">
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                            <MapPin className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                                            {place.displayName_text}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(place.search_type)}`}>
                                                        {getTypeLabel(place.search_type)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                                                        <span className="text-sm text-gray-700">
                                                            {place.rating?.toFixed(1) ?? '—'}
                                                        </span>
                                                        {place.userRatingCount > 0 && (
                                                            <span className="text-xs text-gray-400">
                                                                ({place.userRatingCount.toLocaleString()})
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="text-sm text-gray-700">
                                                            {place.avg_price > 0 ? place.avg_price.toFixed(0) : '—'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-gray-500 font-mono">
                                                        {place.location?.latitude?.toFixed(4)}, {place.location?.longitude?.toFixed(4)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-xs text-gray-500 font-mono truncate max-w-[100px] block">
                                                        {cities.find(c => c.id === place.city_id)?.city ?? place.city_id ?? '—'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleOpenEdit(place)}
                                                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                                            title="Sửa"
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => { setDeletingPlace(place); setShowDeleteModal(true) }}
                                                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                            title="Xóa"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500">
                                    Hiển thị <span className="font-medium text-gray-700">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span>
                                    {' '}–{' '}
                                    <span className="font-medium text-gray-700">
                                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredPlaces.length)}
                                    </span>
                                    {' '}trong{' '}
                                    <span className="font-medium text-gray-700">{filteredPlaces.length}</span> địa điểm
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="h-8 w-8 p-0 border-gray-200"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                        .reduce<(number | string)[]>((acc, page, i, arr) => {
                                            if (i > 0 && (page as number) - (arr[i - 1] as number) > 1) acc.push('…')
                                            acc.push(page)
                                            return acc
                                        }, [])
                                        .map((item, i) =>
                                            item === '…' ? (
                                                <span key={`ellipsis-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                                            ) : (
                                                <Button
                                                    key={item}
                                                    variant={currentPage === item ? 'default' : 'outline'}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(item as number)}
                                                    className={`h-8 w-8 p-0 text-sm ${currentPage === item
                                                        ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'
                                                        : 'border-gray-200'
                                                        }`}
                                                >
                                                    {item}
                                                </Button>
                                            )
                                        )}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="h-8 w-8 p-0 border-gray-200"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create Location Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
                        <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900">
                                    Tạo địa điểm mới
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        resetForm()
                                        setErrorMessage('')
                                    }}
                                    className="text-gray-500"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Success/Error Messages */}
                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                    <span className="text-green-700">{successMessage}</span>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    <span className="text-red-700">{errorMessage}</span>
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-6">
                                {/* Basic Info Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={formData.id}
                                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                                className="bg-gray-50 border-gray-200"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Tên địa điểm <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={formData.displayName_text}
                                                onChange={(e) => setFormData({ ...formData, displayName_text: e.target.value })}
                                                placeholder="VD: Wangbijib Myeongdong Central"
                                                className="bg-gray-50 border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Thành phố <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.city}
                                                onChange={(e) => handleCityChange(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                disabled={loadingCities}
                                            >
                                                <option value="">Chọn thành phố</option>
                                                {cities.map((city) => (
                                                    <option key={city.id} value={city.city}>
                                                        {city.city}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                City ID
                                            </label>
                                            <Input
                                                value={formData.city_id}
                                                readOnly
                                                placeholder="Tự động điền khi chọn thành phố"
                                                className="bg-gray-100 border-gray-200 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mô tả
                                            </label>
                                            <textarea
                                                value={formData.editorialSummary_text}
                                                onChange={(e) => setFormData({ ...formData, editorialSummary_text: e.target.value })}
                                                placeholder="Mô tả ngắn về địa điểm..."
                                                rows={3}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPinned className="h-5 w-5 text-green-500" />
                                        Vị trí
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vĩ độ (Latitude)
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                value={formData.location.latitude}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    location: { ...formData.location, latitude: parseFloat(e.target.value) || 0 }
                                                })}
                                                placeholder="VD: 37.5610364"
                                                className="bg-gray-50 border-gray-200"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Kinh độ (Longitude)
                                            </label>
                                            <Input
                                                type="number"
                                                step="any"
                                                value={formData.location.longitude}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    location: { ...formData.location, longitude: parseFloat(e.target.value) || 0 }
                                                })}
                                                placeholder="VD: 126.98238710000001"
                                                className="bg-gray-50 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Category Section */}
                                <div className="gap-4 ">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-purple-500" />
                                        Phân loại
                                    </h3>
                                    <div className="gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Loại tìm kiếm (Search Type)
                                            </label>
                                            <select
                                                value={formData.search_type}
                                                onChange={(e) => setFormData({ ...formData, search_type: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                            >
                                                {SEARCH_TYPES.map((type) => (
                                                    <option key={type.value} value={type.value}>
                                                        {type.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Rating & Price Section */}
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        Giá
                                    </h3>
                                    <div className="gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Giá trung bình ($)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.avg_price}
                                                onChange={(e) => setFormData({ ...formData, avg_price: parseFloat(e.target.value) || 0 })}
                                                placeholder="VD: 20"
                                                className="bg-gray-50 border-gray-200"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Images Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-pink-500" />
                                        Hình ảnh
                                        {formData.image_url.filter(u => u).length > 0 && (
                                            <span className="ml-1 text-xs font-normal text-gray-500">
                                                ({formData.image_url.filter(u => u).length} ảnh)
                                            </span>
                                        )}
                                    </h3>

                                    <ImageUploader
                                        ref={createUploaderRef}
                                        folder="/places"
                                    />

                                    {/* Saved URL list */}
                                    {formData.image_url.filter(u => u).length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {formData.image_url.filter(u => u).map((url, index) => (
                                                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80?text=Err' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, image_url: prev.image_url.filter((_, i) => i !== index) }))}
                                                        className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-200"
                                    onClick={() => {
                                        setShowCreateModal(false)
                                        resetForm()
                                        setErrorMessage('')
                                    }}
                                    disabled={actionLoading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={handleCreateLocation}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Đang tạo…' : 'Tạo địa điểm'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Edit Location Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
                        <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <Pencil className="h-5 w-5 text-blue-500" />
                                    Chỉnh sửa địa điểm
                                </CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setShowEditModal(false); setEditingPlaceId(null); setErrorMessage(''); setSuccessMessage('') }}
                                    className="text-gray-500"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {editLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                                        <p className="text-sm text-gray-500">Đang tải thông tin...</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {successMessage && (
                                        <div className="mb-6 p-4 bg-green-100 border border-green-200 rounded-lg flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            <span className="text-green-700">{successMessage}</span>
                                        </div>
                                    )}
                                    {errorMessage && (
                                        <div className="mb-6 p-4 bg-red-100 border border-red-200 rounded-lg flex items-center gap-3">
                                            <AlertCircle className="h-5 w-5 text-red-600" />
                                            <span className="text-red-700">{errorMessage}</span>
                                        </div>
                                    )}
                                    <div className="space-y-6">
                                        {/* Basic Info */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <FileText className="h-5 w-5 text-blue-500" />
                                                Thông tin cơ bản
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">ID</label>
                                                    <Input value={editFormData.id} readOnly className="bg-gray-100 border-gray-200 cursor-not-allowed" />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                                        Tên địa điểm <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        value={editFormData.displayName_text}
                                                        onChange={(e) => setEditFormData({ ...editFormData, displayName_text: e.target.value })}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành phố</label>
                                                    <select
                                                        value={editFormData.city}
                                                        onChange={(e) => handleEditCityChange(e.target.value)}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                        disabled={loadingCities}
                                                    >
                                                        <option value="">Chọn thành phố</option>
                                                        {cities.map((city) => (
                                                            <option key={city.id} value={city.city}>{city.city}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">City ID</label>
                                                    <Input value={editFormData.city_id} readOnly className="bg-gray-100 border-gray-200 cursor-not-allowed" />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                                                    <textarea
                                                        value={editFormData.editorialSummary_text}
                                                        onChange={(e) => setEditFormData({ ...editFormData, editorialSummary_text: e.target.value })}
                                                        rows={3}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Location */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <MapPinned className="h-5 w-5 text-green-500" />
                                                Vị trí
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Vĩ độ (Latitude)</label>
                                                    <Input
                                                        type="number" step="any"
                                                        value={editFormData.location.latitude}
                                                        onChange={(e) => setEditFormData({ ...editFormData, location: { ...editFormData.location, latitude: parseFloat(e.target.value) || 0 } })}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Kinh độ (Longitude)</label>
                                                    <Input
                                                        type="number" step="any"
                                                        value={editFormData.location.longitude}
                                                        onChange={(e) => setEditFormData({ ...editFormData, location: { ...editFormData.location, longitude: parseFloat(e.target.value) || 0 } })}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Category & Price */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                                <Tag className="h-5 w-5 text-purple-500" />
                                                Phân loại & Giá
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại</label>
                                                    <select
                                                        value={editFormData.search_type}
                                                        onChange={(e) => setEditFormData({ ...editFormData, search_type: e.target.value })}
                                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                                    >
                                                        {SEARCH_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-2">Giá trung bình ($)</label>
                                                    <Input
                                                        type="number" min="0"
                                                        value={editFormData.avg_price}
                                                        onChange={(e) => setEditFormData({ ...editFormData, avg_price: parseFloat(e.target.value) || 0 })}
                                                        className="bg-gray-50 border-gray-200"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Images */}
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                                <ImageIcon className="h-5 w-5 text-pink-500" />
                                                Hình ảnh
                                                {editFormData.image_url.filter(u => u).length > 0 && (
                                                    <span className="ml-1 text-xs font-normal text-gray-500">
                                                        ({editFormData.image_url.filter(u => u).length} ảnh)
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-xs text-blue-600 mb-4 flex items-center gap-1">
                                                <CheckCircle2 className="h-3.5 w-3.5" />
                                                Ảnh mới sẽ được upload và lưu khi nhấn "Lưu thay đổi"
                                            </p>

                                            <ImageUploader
                                                ref={editUploaderRef}
                                                folder="/places"
                                            />

                                            {/* Existing image grid */}
                                            {editFormData.image_url.filter(u => u).length > 0 && (
                                                <div className="mt-4">
                                                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Ảnh hiện tại</p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                                        {editFormData.image_url.filter(u => u).map((url, idx) => (
                                                            <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                                                                <img
                                                                    src={url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80?text=Err' }}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditFormData(prev => ({ ...prev, image_url: prev.image_url.filter((_, i) => i !== idx) }))
                                                                    }}
                                                                    className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-all"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                                        <Button
                                            variant="outline"
                                            className="flex-1 border-gray-200"
                                            onClick={() => { setShowEditModal(false); setEditingPlaceId(null); setErrorMessage(''); setSuccessMessage('') }}
                                            disabled={actionLoading}
                                        >
                                            Hủy
                                        </Button>
                                        <Button
                                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                            onClick={handleUpdateLocation}
                                            disabled={actionLoading}
                                        >
                                            {actionLoading ? 'Đang lưu…' : 'Lưu thay đổi'}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && deletingPlace && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white border-gray-200">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                    <Trash2 className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">Hành động này không thể hoàn tác</p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                                <p className="text-sm text-gray-600 mb-1">Địa điểm sẽ bị xóa:</p>
                                <p className="font-semibold text-gray-900">{deletingPlace.displayName_text}</p>
                                <span className={`inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeClass(deletingPlace.search_type)}`}>
                                    {getTypeLabel(deletingPlace.search_type)}
                                </span>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-200"
                                    onClick={() => { setShowDeleteModal(false); setDeletingPlace(null) }}
                                    disabled={deleteLoading}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDeleteLocation}
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? 'Đang xóa…' : 'Xóa địa điểm'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AdminLayout>
    )
}

export default LocationManagementPage

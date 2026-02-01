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
    CheckCircle2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { CityService } from '@/services/city.service'
import { City } from '@/types/domain'

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
    // City data
    const [cities, setCities] = useState<City[]>([])
    const [loadingCities, setLoadingCities] = useState(true)

    // Modal states
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

    // Form data
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
        image_url: ['']
    })

    // New image URL input
    const [newImageUrl, setNewImageUrl] = useState('')

    // Fetch cities on mount
    useEffect(() => {
        fetchCities()
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

    // Handle add image URL
    const handleAddImageUrl = () => {
        if (newImageUrl.trim()) {
            setFormData({
                ...formData,
                image_url: [...formData.image_url, newImageUrl.trim()]
            })
            setNewImageUrl('')
        }
    }

    // Handle remove image URL
    const handleRemoveImageUrl = (index: number) => {
        setFormData({
            ...formData,
            image_url: formData.image_url.filter((_, i) => i !== index)
        })
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
            image_url: ['']
        })
        setNewImageUrl('')
    }

    // Handle form submission
    const handleCreateLocation = async () => {
        try {
            setActionLoading(true)
            setErrorMessage('')

            // Validate required fields
            if (!formData.city || !formData.displayName_text) {
                setErrorMessage('Vui lòng điền đầy đủ các trường bắt buộc (Thành phố, Tên)')
                return
            }

            // TODO: Call API to create location
            // For now, just show success message
            console.log('Creating location:', formData)

            setSuccessMessage('Tạo địa điểm thành công!')
            setTimeout(() => {
                setSuccessMessage('')
                setShowCreateModal(false)
                resetForm()
            }, 2000)

        } catch (err: any) {
            setErrorMessage(err.message || 'Không thể tạo địa điểm')
        } finally {
            setActionLoading(false)
        }
    }

    return (
        <AdminLayout title="Quản lý Địa điểm" description="Tạo và quản lý các địa điểm du lịch">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Tổng địa điểm</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-500/20">
                                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Nhà hàng</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-500/20">
                                <Globe className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Khách sạn</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-500/20">
                                <MapPinned className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Điểm tham quan</p>
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">0</h3>
                            </div>
                            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-500/20">
                                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Bar */}
            <Card className="mb-6 bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Search */}
                        <div className="flex-1 w-full md:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                                <Input
                                    placeholder="Tìm kiếm địa điểm..."
                                    className="pl-10 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                />
                            </div>
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

            {/* Locations List - Empty State */}
            <Card className="bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                        Danh sách địa điểm
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                            <MapPin className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-2">Chưa có địa điểm nào</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500">Bắt đầu bằng cách thêm địa điểm mới</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Create Location Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-4xl bg-white dark:bg-[#242b3d] border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <CardHeader className="border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-[#242b3d] z-10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
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
                                    className="text-gray-500 dark:text-gray-400"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            {/* Success/Error Messages */}
                            {successMessage && (
                                <div className="mb-6 p-4 bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 rounded-lg flex items-center gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    <span className="text-green-700 dark:text-green-400">{successMessage}</span>
                                </div>
                            )}
                            {errorMessage && (
                                <div className="mb-6 p-4 bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-lg flex items-center gap-3">
                                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    <span className="text-red-700 dark:text-red-400">{errorMessage}</span>
                                </div>
                            )}

                            {/* Form */}
                            <div className="space-y-6">
                                {/* Basic Info Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-500" />
                                        Thông tin cơ bản
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                ID <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={formData.id}
                                                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Tên địa điểm <span className="text-red-500">*</span>
                                            </label>
                                            <Input
                                                value={formData.displayName_text}
                                                onChange={(e) => setFormData({ ...formData, displayName_text: e.target.value })}
                                                placeholder="VD: Wangbijib Myeongdong Central"
                                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Thành phố <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.city}
                                                onChange={(e) => handleCityChange(e.target.value)}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                City ID
                                            </label>
                                            <Input
                                                value={formData.city_id}
                                                readOnly
                                                placeholder="Tự động điền khi chọn thành phố"
                                                className="bg-gray-100 dark:bg-slate-900 border-gray-200 dark:border-gray-700 cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Mô tả
                                            </label>
                                            <textarea
                                                value={formData.editorialSummary_text}
                                                onChange={(e) => setFormData({ ...formData, editorialSummary_text: e.target.value })}
                                                placeholder="Mô tả ngắn về địa điểm..."
                                                rows={3}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Location Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <MapPinned className="h-5 w-5 text-green-500" />
                                        Vị trí
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Category Section */}
                                <div className="gap-4 ">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-purple-500" />
                                        Phân loại
                                    </h3>
                                    <div className="gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Loại tìm kiếm (Search Type)
                                            </label>
                                            <select
                                                value={formData.search_type}
                                                onChange={(e) => setFormData({ ...formData, search_type: e.target.value })}
                                                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Star className="h-5 w-5 text-yellow-500" />
                                        Giá
                                    </h3>
                                    <div className="gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Giá trung bình ($)
                                            </label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.avg_price}
                                                onChange={(e) => setFormData({ ...formData, avg_price: parseFloat(e.target.value) || 0 })}
                                                placeholder="VD: 20"
                                                className="bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Images Section */}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <ImageIcon className="h-5 w-5 text-pink-500" />
                                        Hình ảnh
                                    </h3>

                                    {/* Add new image URL */}
                                    <div className="flex gap-2 mb-4">
                                        <Input
                                            value={newImageUrl}
                                            onChange={(e) => setNewImageUrl(e.target.value)}
                                            placeholder="Nhập URL hình ảnh..."
                                            className="flex-1 bg-gray-50 dark:bg-slate-950 border-gray-200 dark:border-gray-700"
                                        />
                                        <Button
                                            type="button"
                                            onClick={handleAddImageUrl}
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Image URLs list */}
                                    <div className="space-y-2">
                                        {formData.image_url.filter(url => url).map((url, index) => (
                                            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                                                    <img
                                                        src={url}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Error'
                                                        }}
                                                    />
                                                </div>
                                                <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                                                    {url}
                                                </span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveImageUrl(index)}
                                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {formData.image_url.filter(url => url).length === 0 && (
                                            <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                                                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                <p className="text-sm">Chưa có hình ảnh nào</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-200 dark:border-gray-700"
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
                                    {actionLoading ? 'Đang tạo...' : 'Tạo địa điểm'}
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

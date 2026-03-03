'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Search,
    Plus,
    X,
    Star,
    DollarSign,
    Globe,
    CalendarDays,
    Trash2,
    AlertCircle,
    Loader2,
    Hotel,
    ChevronLeft,
    ChevronRight,
    Filter,
    MapPin,
    Pencil,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TourService, TourDocument } from '@/services/tour.service'
import { CityService } from '@/services/city.service'
import { City } from '@/types/domain'

const ITEMS_PER_PAGE = 10

// ─── Delete Confirmation Modal ─────────────────────────────────────────────────

interface DeleteModalProps {
    tour: TourDocument
    loading: boolean
    onConfirm: () => void
    onCancel: () => void
}

function DeleteModal({ tour, loading, onConfirm, onCancel }: DeleteModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">Xác nhận xoá tour</h3>
                        <p className="text-sm text-gray-500">
                            Bạn có chắc muốn xoá tour <span className="font-medium text-gray-700">&ldquo;{tour.title}&rdquo;</span>? Hành động này không thể hoàn tác.
                        </p>
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel} disabled={loading}>
                        Huỷ
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Xoá tour
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

function ToursListPage() {
    const router = useRouter()

    const [tours, setTours] = useState<TourDocument[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [loading, setLoading] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')

    // Search & filter
    const [searchQuery, setSearchQuery] = useState('')
    const [filterCity, setFilterCity] = useState('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)

    // Delete
    const [deletingTour, setDeletingTour] = useState<TourDocument | null>(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

    // Fetch data on mount
    useEffect(() => {
        Promise.all([TourService.getAllTours(), CityService.getCities()])
            .then(([toursData, citiesData]) => {
                setTours(toursData)
                setCities(citiesData)
            })
            .catch(err => setErrorMessage(err.message ?? 'Tải dữ liệu thất bại.'))
            .finally(() => setLoading(false))
    }, [])

    // ── Filter & paginate ───────────────────────────────────────────────────────
    const filtered = tours.filter(t => {
        const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.destination.city.toLowerCase().includes(searchQuery.toLowerCase())
        const matchCity = filterCity === 'all' || t.destination.city === filterCity
        return matchSearch && matchCity
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
    const paginated = filtered.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    )

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
        setCurrentPage(1)
    }

    const handleFilterChange = (value: string) => {
        setFilterCity(value)
        setCurrentPage(1)
    }

    // ── Delete ──────────────────────────────────────────────────────────────────
    const handleDeleteConfirm = async () => {
        if (!deletingTour) return
        setDeleteLoading(true)
        try {
            await TourService.deleteTour(deletingTour.tour_id)
            setTours(prev => prev.filter(t => t.tour_id !== deletingTour.tour_id))
            setDeletingTour(null)
        } catch (err: any) {
            setErrorMessage(err.message ?? 'Xoá tour thất bại.')
            setDeletingTour(null)
        } finally {
            setDeleteLoading(false)
        }
    }

    // Unique cities from tour data (for filter dropdown)
    const uniqueCities = Array.from(new Set(tours.map(t => t.destination.city))).sort()

    return (
        <AdminLayout title="Quản lý Tour" description="Tìm kiếm, xem và quản lý các tour du lịch">

            {/* Error banner */}
            {errorMessage && (
                <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                    <button onClick={() => setErrorMessage('')} className="ml-auto">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* ── Search + Filter + Add button ── */}
            <Card className="mb-6 border border-gray-200 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <Input
                                placeholder="Tìm kiếm tên tour, thành phố..."
                                value={searchQuery}
                                onChange={e => handleSearchChange(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        {/* City filter */}
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            <select
                                value={filterCity}
                                onChange={e => handleFilterChange(e.target.value)}
                                className="pl-9 pr-8 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none min-w-[160px]"
                            >
                                <option value="all">Tất cả thành phố</option>
                                {uniqueCities.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        {/* Add button */}
                        <Button
                            onClick={() => router.push('/admin/tours/create-tour')}
                            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
                        >
                            <Plus className="h-4 w-4" />
                            Thêm tour mới
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* ── Table ── */}
            <Card className="border border-gray-200 shadow-sm overflow-hidden">
                {/* Table header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">Danh sách tour</h3>
                    <span className="text-sm text-gray-500">
                        {filtered.length} tour
                    </span>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span className="text-sm">Đang tải...</span>
                    </div>
                ) : paginated.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                        <Globe className="h-10 w-10 opacity-30" />
                        <p className="text-sm">
                            {searchQuery || filterCity !== 'all'
                                ? 'Không tìm thấy tour phù hợp.'
                                : 'Chưa có tour nào. Hãy thêm tour mới!'}
                        </p>
                        {!searchQuery && filterCity === 'all' && (
                            <Button
                                size="sm"
                                onClick={() => router.push('/admin/tours/create-tour')}
                                className="gap-1 bg-blue-600 hover:bg-blue-700 text-white mt-1"
                            >
                                <Plus className="h-4 w-4" />
                                Thêm tour mới
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50">
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-8">#</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên tour</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm đến</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Khách sạn</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng giá</th>
                                    <th className="py-3 px-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                                    <th className="py-3 px-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginated.map((tour, idx) => {
                                    const createdDate = tour.created_at
                                        ? new Date(tour.created_at).toLocaleDateString('vi-VN')
                                        : '—'

                                    return (
                                        <tr
                                            key={tour.tour_id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            {/* # */}
                                            <td className="py-3 px-4 text-gray-400 text-xs">
                                                {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                                            </td>

                                            {/* Title */}
                                            <td className="py-3 px-4 max-w-[220px]">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                        <Globe className="h-4 w-4 text-blue-600" />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                                                        {tour.title}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Destination */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    <span className="font-medium">{tour.destination.city}</span>
                                                    {tour.destination.country && (
                                                        <span className="text-gray-400">, {tour.destination.country}</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Duration */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 text-sm text-gray-700">
                                                    <CalendarDays className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                                    {tour.duration_days} ngày
                                                </div>
                                            </td>

                                            {/* Hotel */}
                                            <td className="py-3 px-4 max-w-[160px]">
                                                {tour.accommodation?.hotel_name ? (
                                                    <div className="flex items-start gap-1.5">
                                                        <Hotel className="h-3.5 w-3.5 text-purple-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm text-gray-700 line-clamp-1">
                                                                {tour.accommodation.hotel_name}
                                                            </p>
                                                            {tour.accommodation.hotel_rating > 0 && (
                                                                <div className="flex items-center gap-0.5 mt-0.5">
                                                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                                                    <span className="text-xs text-gray-500">
                                                                        {tour.accommodation.hotel_rating.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">—</span>
                                                )}
                                            </td>

                                            {/* Total price */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-1 font-semibold text-blue-600">
                                                    <DollarSign className="h-3.5 w-3.5" />
                                                    {tour.pricing?.total?.toLocaleString() ?? '—'}
                                                </div>
                                            </td>

                                            {/* Created at */}
                                            <td className="py-3 px-4">
                                                <span className="text-xs text-gray-500">{createdDate}</span>
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => router.push(`/admin/tours/${tour.tour_id}/edit`)}
                                                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                                        title="Sửa"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setDeletingTour(tour)}
                                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                        title="Xoá"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!loading && filtered.length > ITEMS_PER_PAGE && (
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Hiển thị{' '}
                            <span className="font-medium text-gray-700">
                                {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                            </span>
                            {' '}–{' '}
                            <span className="font-medium text-gray-700">
                                {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)}
                            </span>
                            {' '}trong{' '}
                            <span className="font-medium text-gray-700">{filtered.length}</span> tour
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
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                                    if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('ellipsis')
                                    acc.push(p)
                                    return acc
                                }, [])
                                .map((item, i) =>
                                    item === 'ellipsis' ? (
                                        <span key={`e-${i}`} className="px-1 text-gray-400 text-sm">…</span>
                                    ) : (
                                        <Button
                                            key={item}
                                            variant={currentPage === item ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(item as number)}
                                            className={`h-8 w-8 p-0 text-xs ${currentPage === item
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'border-gray-200'
                                                }`}
                                        >
                                            {item}
                                        </Button>
                                    )
                                )
                            }

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
                )}
            </Card>

            {/* Delete confirmation modal */}
            {deletingTour && (
                <DeleteModal
                    tour={deletingTour}
                    loading={deleteLoading}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeletingTour(null)}
                />
            )}
        </AdminLayout>
    )
}

export default ToursListPage

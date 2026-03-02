'use client'

import { AdminLayout } from '@/components/admin/AdminLayout'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Users,
    Search,
    Edit,
    Trash2,
    Shield,
    UserCog,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    X,
    UserPlus,
    User
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { UserService, UserStats } from '@/services/user.service'
import { User as UserType } from '@/types/domain'

/**
 * User Management Page - Admin Only
 * Features: View users, search, filter, edit role, delete, create, update
 */
function UserManagementPage() {
    const { user: currentUser } = useAuthStore()

    // User data states
    const [users, setUsers] = useState<UserType[]>([])
    const [filteredUsers, setFilteredUsers] = useState<UserType[]>([])
    const [stats, setStats] = useState<UserStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter states
    const [searchQuery, setSearchQuery] = useState('')
    const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const usersPerPage = 5

    // Modal states
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<UserType | null>(null)
    const [actionLoading, setActionLoading] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullname: '',
        phone: '',
        address: '',
        role: 'user' as 'user' | 'admin',
        status: 'active' as 'active' | 'inactive'
    })

    // Fetch users on mount
    useEffect(() => {
        fetchUsers()
        fetchStats()
    }, [])

    // Apply filters when search or filter changes
    useEffect(() => {
        applyFilters()
    }, [users, searchQuery, roleFilter, statusFilter])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await UserService.getUsers()
            setUsers(data.users)
        } catch (err: any) {
            setError(err.message || 'Failed to load users')
        } finally {
            setLoading(false)
        }
    }

    const fetchStats = async () => {
        try {
            const data = await UserService.getUserStats()
            setStats(data)
        } catch (err) {
            console.error('Failed to load stats:', err)
        }
    }

    const applyFilters = () => {
        let filtered = [...users]

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (user) =>
                    user.fullname?.toLowerCase().includes(query) ||
                    user.email.toLowerCase().includes(query) ||
                    user.id.toLowerCase().includes(query)
            )
        }

        // Role filter
        if (roleFilter !== 'all') {
            filtered = filtered.filter((user) => user.role === roleFilter)
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter((user) => user.status === statusFilter)
        }

        setFilteredUsers(filtered)
        setCurrentPage(1) // Reset to first page when filters change
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await UserService.deleteUser(selectedUser.id)
            await fetchUsers()
            await fetchStats()
            setShowDeleteModal(false)
            setSelectedUser(null)
        } catch (err: any) {
            alert(err.message || 'Failed to delete user')
        } finally {
            setActionLoading(false)
        }
    }

    const handleChangeRole = async (newRole: 'user' | 'admin') => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await UserService.updateUserRole(selectedUser.id, newRole)
            await fetchUsers()
            await fetchStats()
            setShowRoleModal(false)
            setSelectedUser(null)
        } catch (err: any) {
            alert(err.message || 'Failed to update role')
        } finally {
            setActionLoading(false)
        }
    }

    const handleCreateUser = async () => {
        try {
            setActionLoading(true)
            await UserService.createUser(formData)
            await fetchUsers()
            await fetchStats()
            setShowCreateModal(false)
            setFormData({
                email: '',
                password: '',
                fullname: '',
                phone: '',
                address: '',
                role: 'user',
                status: 'active'
            })
        } catch (err: any) {
            alert(err.message || 'Failed to create user')
        } finally {
            setActionLoading(false)
        }
    }

    const handleEditUser = async () => {
        if (!selectedUser) return

        try {
            setActionLoading(true)
            await UserService.updateUser(selectedUser.id, formData)
            await fetchUsers()
            await fetchStats()
            setShowEditModal(false)
            setSelectedUser(null)
            setFormData({
                email: '',
                password: '',
                fullname: '',
                phone: '',
                address: '',
                role: 'user',
                status: 'active'
            })
        } catch (err: any) {
            alert(err.message || 'Failed to update user')
        } finally {
            setActionLoading(false)
        }
    }

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage
    const indexOfFirstUser = indexOfLastUser - usersPerPage
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser)
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage)

    return (
        <AdminLayout title="User Management" description="Manage and monitor all users in the system">
            {/* Stats Grid */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.total_users}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-purple-100">
                                    <Users className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Active Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.active_users}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-green-100">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Admins</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.by_role.admin}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-100">
                                    <Shield className="h-6 w-6 text-cyan-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-gray-200 hover:border-gray-300 transition-colors">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-2">Regular Users</p>
                                    <h3 className="text-3xl font-bold text-gray-900">{stats.by_role.user}</h3>
                                </div>
                                <div className="p-3 rounded-xl bg-blue-100">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Filters and Search */}
            <Card className="mb-6 bg-white border-gray-200">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name, email or ID..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 bg-gray-50 border-gray-200"
                                />
                            </div>
                        </div>

                        {/* Role Filter */}
                        <div className="w-full md:w-48">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value as any)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Roles</option>
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="w-full md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-white border-gray-200">
                <CardHeader className="border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-bold text-gray-900">
                            Users ({filteredUsers.length})
                        </CardTitle>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                                <p className="mt-3 text-sm text-gray-600">Loading users...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        </div>
                    ) : currentUsers.length === 0 ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-600">No users found</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentUsers.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="hover:bg-gray-50 transition-colors"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 flex-shrink-0">
                                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                                                <span className="text-white font-semibold text-sm">
                                                                    {user.fullname?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.fullname || 'N/A'}
                                                            </div>

                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{user.email}</div>
                                                    <div className="text-xs text-gray-500">{user.phone || 'No phone'}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'admin'
                                                            ? 'bg-cyan-100 text-cyan-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                            }`}
                                                    >
                                                        {user.role === 'admin' ? (
                                                            <Shield className="h-3 w-3 mr-1" />
                                                        ) : (
                                                            <User className="h-3 w-3 mr-1" />
                                                        )}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(user.created_at).toLocaleDateString('vi-VN')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setFormData({
                                                                    email: user.email,
                                                                    password: '',
                                                                    fullname: user.fullname || '',
                                                                    phone: user.phone || '',
                                                                    address: user.address || '',
                                                                    role: user.role,
                                                                    status: user.status
                                                                })
                                                                setShowEditModal(true)
                                                            }}
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setShowDeleteModal(true)
                                                            }}
                                                            disabled={user.id === currentUser?.id}
                                                            className="text-red-600 hover:text-red-700"
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
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-700">
                                        Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of{' '}
                                        {filteredUsers.length} users
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="border-gray-200"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-sm text-gray-700">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="border-gray-200"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md bg-white border-gray-200">
                        <CardHeader className="border-b border-gray-200">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl font-bold text-gray-900">Delete User</CardTitle>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedUser(null)
                                    }}
                                    className="text-gray-500"
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="mb-6">
                                <div className="flex items-center justify-center mb-4">
                                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                                        <AlertCircle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                                <p className="text-center text-gray-900 mb-2">
                                    Are you sure you want to delete this user?
                                </p>
                                <p className="text-center text-sm text-gray-600">
                                    <strong>{selectedUser.fullname || selectedUser.email}</strong>
                                    <br />
                                    This action cannot be undone.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 border-gray-200"
                                    onClick={() => {
                                        setShowDeleteModal(false)
                                        setSelectedUser(null)
                                    }}
                                    disabled={actionLoading}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                    onClick={handleDeleteUser}
                                    disabled={actionLoading}
                                >
                                    {actionLoading ? 'Deleting...' : 'Delete'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )
            }

            {/* Change Role Modal */}
            {
                showRoleModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-md bg-white border-gray-200">
                            <CardHeader className="border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-gray-900">Change User Role</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowRoleModal(false)
                                            setSelectedUser(null)
                                        }}
                                        className="text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="mb-6">
                                    <p className="text-center text-gray-900 mb-4">
                                        Change role for <strong>{selectedUser.fullname || selectedUser.email}</strong>
                                    </p>
                                    <p className="text-center text-sm text-gray-600 mb-4">
                                        Current role: <strong>{selectedUser.role}</strong>
                                    </p>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-200"
                                        onClick={() => {
                                            setShowRoleModal(false)
                                            setSelectedUser(null)
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                                        onClick={() => handleChangeRole(selectedUser.role === 'admin' ? 'user' : 'admin')}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading
                                            ? 'Updating...'
                                            : `Change to ${selectedUser.role === 'admin' ? 'User' : 'Admin'}`}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Create User Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
                            <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-gray-900">Create New User</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setFormData({
                                                email: '',
                                                password: '',
                                                fullname: '',
                                                phone: '',
                                                address: '',
                                                role: 'user',
                                                status: 'active'
                                            })
                                        }}
                                        className="text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="user@example.com"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Password <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            placeholder="Minimum 8 characters"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <Input
                                            value={formData.fullname}
                                            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                            placeholder="John Doe"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="0123456789"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="123 Main St, City"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-200"
                                        onClick={() => {
                                            setShowCreateModal(false)
                                            setFormData({
                                                email: '',
                                                password: '',
                                                fullname: '',
                                                phone: '',
                                                address: '',
                                                role: 'user',
                                                status: 'active'
                                            })
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={handleCreateUser}
                                        disabled={actionLoading || !formData.email || !formData.password}
                                    >
                                        {actionLoading ? 'Creating...' : 'Create User'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                showEditModal && selectedUser && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <Card className="w-full max-w-2xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
                            <CardHeader className="border-b border-gray-200 sticky top-0 bg-white z-10">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl font-bold text-gray-900">Edit User</CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setSelectedUser(null)
                                            setFormData({
                                                email: '',
                                                password: '',
                                                fullname: '',
                                                phone: '',
                                                address: '',
                                                role: 'user',
                                                status: 'active'
                                            })
                                        }}
                                        className="text-gray-500"
                                    >
                                        <X className="h-5 w-5" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Email
                                        </label>
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="user@example.com"
                                            className="bg-gray-50"
                                            disabled={true}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Full Name
                                        </label>
                                        <Input
                                            value={formData.fullname}
                                            onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                                            placeholder="John Doe"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Phone
                                        </label>
                                        <Input
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="0123456789"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Role
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900"
                                        >
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Address
                                        </label>
                                        <Input
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="123 Main St, City"
                                            className="bg-gray-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Status
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-900"
                                        >
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="flex-1 border-gray-200"
                                        onClick={() => {
                                            setShowEditModal(false)
                                            setSelectedUser(null)
                                            setFormData({
                                                email: '',
                                                password: '',
                                                fullname: '',
                                                phone: '',
                                                address: '',
                                                role: 'user',
                                                status: 'active'
                                            })
                                        }}
                                        disabled={actionLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                                        onClick={handleEditUser}
                                        disabled={actionLoading}
                                    >
                                        {actionLoading ? 'Updating...' : 'Update User'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )
            }
        </AdminLayout >
    )
}

// Export directly - AdminLayout already includes AuthGuard
export default UserManagementPage

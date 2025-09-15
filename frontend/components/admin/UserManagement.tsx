'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

interface UserManagementProps {
  onError?: (message: string) => void
  onInfo?: (message: string) => void
}

interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: 'user' | 'admin'
  created_at: string
}

export default function UserManagement({ onError, onInfo }: UserManagementProps) {
  const { language } = useAppStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Mock data for now - replace with actual API call
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        const mockUsers: User[] = [
          {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            phone: '+84123456789',
            role: 'admin',
            created_at: '2024-01-01T00:00:00Z'
          },
          {
            id: '2', 
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+84987654321',
            role: 'user',
            created_at: '2024-01-15T00:00:00Z'
          },
          {
            id: '3',
            name: 'Jane Smith', 
            email: 'jane@example.com',
            role: 'user',
            created_at: '2024-02-01T00:00:00Z'
          }
        ]
        
        setUsers(mockUsers)
        setTotalPages(1)
        onInfo?.(language === 'vi' ? 'Đã tải danh sách người dùng' : 'Users loaded successfully')
      } catch (error) {
        onError?.(language === 'vi' ? 'Không thể tải danh sách người dùng' : 'Failed to load users')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [currentPage, searchTerm, onError, onInfo, language])

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-4 text-gray-600">
            {language === 'vi' ? 'Đang tải...' : 'Loading...'}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {language === 'vi' ? 'Quản lý người dùng' : 'User Management'}
        </h2>
        <p className="text-gray-600">
          {language === 'vi' ? 'Quản lý tài khoản người dùng trong hệ thống' : 'Manage user accounts in the system'}
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm kiếm theo tên hoặc email...' : 'Search by name or email...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-4 text-gray-400"></i>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                {language === 'vi' ? 'Tên' : 'Name'}
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">Email</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                {language === 'vi' ? 'Số điện thoại' : 'Phone'}
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                {language === 'vi' ? 'Vai trò' : 'Role'}
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                {language === 'vi' ? 'Ngày tạo' : 'Created'}
              </th>
              <th className="text-left py-4 px-4 font-semibold text-gray-700">
                {language === 'vi' ? 'Thao tác' : 'Actions'}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-gray-600">{user.email}</td>
                <td className="py-4 px-4 text-gray-600">{user.phone || '-'}</td>
                <td className="py-4 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {user.role === 'admin' 
                      ? (language === 'vi' ? 'Quản trị' : 'Admin')
                      : (language === 'vi' ? 'Người dùng' : 'User')
                    }
                  </span>
                </td>
                <td className="py-4 px-4 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}
                </td>
                <td className="py-4 px-4">
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      {language === 'vi' ? 'Sửa' : 'Edit'}
                    </button>
                    <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                      {language === 'vi' ? 'Xóa' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Info */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {language === 'vi' 
            ? `Hiển thị ${filteredUsers.length} người dùng`
            : `Showing ${filteredUsers.length} users`
          }
        </div>
        <div className="text-sm text-gray-500">
          {language === 'vi' ? 'Trang 1 / 1' : 'Page 1 of 1'}
        </div>
      </div>
    </div>
  )
}
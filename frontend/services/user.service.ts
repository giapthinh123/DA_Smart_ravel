import api from '@/lib/axios'
import { User } from '@/types/domain'

export interface UserStats {
    total_users: number
    active_users: number
    inactive_users: number
    by_role: {
        admin: number
        user: number
    }
}

export interface GetUsersResponse {
    users: User[]
    count: number
}

export class UserService {
    /**
     * Get all users (Admin only)
     */
    static async getUsers(): Promise<GetUsersResponse> {
        try {
            const response = await api.get<GetUsersResponse>('/api/users')
            return response.data
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to fetch users')
        }
    }

    /**
     * Delete user (Admin only)
     */
    static async deleteUser(userId: string): Promise<void> {
        try {
            const response = await api.delete(`/api/users/${userId}`)

            if (response.data?.msg !== 'User deleted successfully') {
                throw new Error(response.data?.msg || 'Failed to delete user')
            }
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to delete user')
        }
    }

    /**
     * Update user role (Admin only)
     */
    static async updateUserRole(userId: string, role: 'user' | 'admin'): Promise<void> {
        try {
            const response = await api.put(`/api/users/${userId}/role`, { role })

            if (!response.data?.msg?.includes('updated')) {
                throw new Error(response.data?.msg || 'Failed to update user role')
            }
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to update user role')
        }
    }

    /**
     * Get user statistics (Admin only)
     */
    static async getUserStats(): Promise<UserStats> {
        try {
            const response = await api.get<UserStats>('/api/users/stats')
            return response.data
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to fetch user statistics')
        }
    }

    /**
     * Create new user (Admin only)
     */
    static async createUser(userData: {
        email: string
        password: string
        fullname?: string
        phone?: string
        address?: string
        role?: 'user' | 'admin'
        status?: 'active' | 'inactive'
    }): Promise<void> {
        try {
            const response = await api.post('/api/users', userData)

            if (response.data?.msg !== 'User created successfully') {
                throw new Error(response.data?.msg || 'Failed to create user')
            }
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to create user')
        }
    }

    /**
     * Update user (Admin only)
     */
    static async updateUser(userId: string, userData: {
        fullname?: string
        phone?: string
        address?: string
        role?: 'user' | 'admin'
        status?: 'active' | 'inactive'
        email?: string
    }): Promise<User> {
        try {
            const response = await api.put(`/api/users/${userId}`, userData)

            if (response.data?.user) {
                return response.data.user
            }

            throw new Error(response.data?.msg || 'Failed to update user')
        } catch (error: any) {
            if (error.response?.data?.msg) {
                throw new Error(error.response.data.msg)
            }
            throw new Error('Failed to update user')
        }
    }
}

import api from '@/lib/axios'

// Types
export interface PaymentDetails {
    itinerary_summary?: {
        total_cost: number
        cost_per_person: number
        budget_utilized_percent: number
        avg_cost_per_day: number
        flight_total?: number
    }
    flight_cost?: number
    daily_costs?: Array<{
        day_number: number
        day_cost: number
    }>
    guest_count?: number
    trip_duration_days?: number
    city_id?: string
}

export interface CreatePaymentRequest {
    tour_id: string
    payment_type?: string
    amount: number
    currency?: string
    payment_method: string
    payment_gateway?: string
    payment_details?: PaymentDetails
}

export interface Payment {
    payment_id: string
    user_id: string
    tour_id: string
    payment_type: string
    amount: number
    currency: string
    payment_method: string
    payment_status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
    transaction_id: string
    payment_gateway: string
    payment_time?: string
    created_at: string
    updated_at: string
    payment_details?: PaymentDetails
}

export interface PaymentResponse {
    message: string
    payment: Payment
}

export interface UserPaymentsResponse {
    count: number
    total: number
    payments: Payment[]
}

export interface PaymentStatsResponse {
    total_payments: number
    total_spent: number
}

export interface AdminPaymentsResponse {
    count: number
    payments: Payment[]
}

export interface AdminPaymentStats {
    total: number
    completed: number
    pending: number
    failed: number
    cancelled: number
    refunded: number
    total_revenue_usd: number
    total_revenue_vnd: number
}

export class PaymentService {
    /**
     * Create a new payment
     */
    static async createPayment(data: CreatePaymentRequest): Promise<PaymentResponse> {
        try {
            console.log('[PaymentService] Creating payment:', data)
            const response = await api.post<PaymentResponse>('/api/payments/create', data)
            console.log('[PaymentService] Payment created:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[PaymentService] Error creating payment:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to create payment')
        }
    }

    /**
     * Confirm/complete a payment
     */
    static async confirmPayment(paymentId: string, transactionId?: string): Promise<PaymentResponse> {
        try {
            console.log('[PaymentService] Confirming payment:', paymentId)
            const response = await api.put<PaymentResponse>(`/api/payments/confirm/${paymentId}`, {
                payment_status: 'completed',
                transaction_id: transactionId || `txn_${Date.now()}`,
            })
            console.log('[PaymentService] Payment confirmed:', response.data)
            return response.data
        } catch (error: any) {
            console.error('[PaymentService] Error confirming payment:', error)
            throw new Error(error.response?.data?.error || error.message || 'Failed to confirm payment')
        }
    }

    /**
     * Get a specific payment by ID
     */
    static async getPayment(paymentId: string): Promise<Payment> {
        try {
            const response = await api.get<{ payment: Payment }>(`/api/payments/${paymentId}`)
            return response.data.payment
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to get payment')
        }
    }

    /**
     * Get all payments for the current user
     */
    static async getUserPayments(options?: {
        limit?: number
        skip?: number
    }): Promise<UserPaymentsResponse> {
        try {
            const params = new URLSearchParams()
            if (options?.limit) params.append('limit', options.limit.toString())
            if (options?.skip) params.append('skip', options.skip.toString())

            const queryString = params.toString()
            const url = `/api/payments/user${queryString ? `?${queryString}` : ''}`
            const response = await api.get<UserPaymentsResponse>(url)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to get payments')
        }
    }

    /**
     * Get payments for a specific tour
     */
    static async getTourPayments(tourId: string): Promise<{ count: number; payments: Payment[] }> {
        try {
            const response = await api.get<{ count: number; payments: Payment[] }>(
                `/api/payments/tour/${tourId}`
            )
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to get tour payments')
        }
    }

    /**
     * Get payment statistics for current user
     */
    static async getPaymentStats(): Promise<PaymentStatsResponse> {
        try {
            const response = await api.get<PaymentStatsResponse>('/api/payments/stats')
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to get payment stats')
        }
    }

    /**
     * Get all payments (admin only)
     */
    static async getAllPayments(options?: {
        limit?: number
        skip?: number
        status?: string
    }): Promise<AdminPaymentsResponse> {
        try {
            const params = new URLSearchParams()
            if (options?.limit) params.append('limit', options.limit.toString())
            if (options?.skip) params.append('skip', options.skip.toString())
            if (options?.status && options.status !== 'all') params.append('status', options.status)

            const queryString = params.toString()
            const url = `/api/payments/admin/all${queryString ? `?${queryString}` : ''}`
            const response = await api.get<AdminPaymentsResponse>(url)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to get all payments')
        }
    }

    /**
     * Create a VNPAY payment URL and redirect the browser to it.
     * Returns the payment URL from the backend.
     */
    static async createVnpayPaymentUrl(data: {
        itinerary_id: string
        amount_usd: number
        order_info?: string
        language?: 'vn' | 'en'
    }): Promise<{ payment_url: string; payment_id: string; amount_vnd: number }> {
        try {
            const response = await api.post<{
                payment_url: string
                payment_id: string
                txn_ref: string
                amount_vnd: number
            }>('/api/payments/vnpay/create-payment-url', data)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to create VNPAY payment URL')
        }
    }

    /**
     * Create a VNPAY payment URL for user registration.
     * No JWT required - this is for new user registration.
     */
    static async createRegistrationPaymentUrl(data: {
        email: string
        password: string
        fullname: string
        phone: string
        plan_id: string
        order_info?: string
    }): Promise<{ payment_url: string; registration_id: string; payment_id: string; amount_vnd: number }> {
        try {
            const response = await api.post<{
                payment_url: string
                registration_id: string
                payment_id: string
                amount_vnd: number
            }>('/api/payments/vnpay/create-payment-url-register', data)
            return response.data
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message || 'Failed to create registration payment URL')
        }
    }
}

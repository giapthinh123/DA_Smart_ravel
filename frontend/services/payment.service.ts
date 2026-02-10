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
    payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
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
}

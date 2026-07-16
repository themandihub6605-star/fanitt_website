import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiSession } from './sessionApi';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
}

export interface ApiBooking {
  _id: string;
  session: ApiSession;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  amountPaid: number;
  createdAt: string;
}

export const bookingApi = {
  create: (sessionId: string) =>
    apiClient
      .post<ApiEnvelope<{ booking: ApiBooking; requiresPayment: boolean; order?: RazorpayOrder }>>('/bookings', { sessionId })
      .then((r) => r.data.data),

  verifyPayment: (payload: {
    bookingId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiClient.post<ApiEnvelope<{ booking: ApiBooking }>>('/bookings/verify-payment', payload).then((r) => r.data.data),

  myBookings: () => apiClient.get<ApiEnvelope<ApiBooking[]>>('/bookings/me').then((r) => r.data.data),

  cancel: (id: string) => apiClient.patch(`/bookings/${id}/cancel`),
};

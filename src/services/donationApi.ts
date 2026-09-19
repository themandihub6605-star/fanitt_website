import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export const donationApi = {
  createOrder: (payload: { sessionId: string; amount: number; message?: string }) =>
    apiClient.post<ApiEnvelope<{ order: RazorpayOrder }>>('/donations/create-order', payload).then((r) => r.data.data),

  verify: (payload: {
    sessionId: string;
    amount: number;
    message?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiClient.post('/donations/verify', payload).then((r) => r.data.data),
};

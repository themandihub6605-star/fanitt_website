import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export interface ApiGift {
  _id: string;
  fromUser: { name: string; avatarUrl?: string };
  amount: number;
  message: string;
  createdAt: string;
}

export const giftApi = {
  createOrder: (payload: { creatorId: string; amount: number; message?: string }) =>
    apiClient.post<ApiEnvelope<{ order: RazorpayOrder }>>('/gifts/create-order', payload).then((r) => r.data.data),

  verify: (payload: {
    creatorId: string;
    amount: number;
    message?: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => apiClient.post<ApiEnvelope<ApiGift>>('/gifts/verify', payload).then((r) => r.data.data),

  getByCreator: (creatorId: string) => apiClient.get<ApiEnvelope<ApiGift[]>>(`/gifts/creator/${creatorId}`).then((r) => r.data.data),
};
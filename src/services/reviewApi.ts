import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiReview {
  _id: string;
  rating: number;
  comment: string;
  fromUser: { name: string; avatarUrl?: string; role: string };
  toUser: { name: string; role: string };
  createdAt: string;
}

export const reviewApi = {
  getFeatured: (limit = 8) =>
    apiClient.get<ApiEnvelope<ApiReview[]>>('/reviews/featured', { params: { limit } }).then((r) => r.data.data),
};

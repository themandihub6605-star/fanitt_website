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

export interface CreateReviewPayload {
  toUser: string;
  relatedModel: 'Campaign' | 'Booking' | 'Session';
  relatedId: string;
  rating: number;
  comment?: string;
  subRatings?: Record<string, number>;
}

export const reviewApi = {
  getFeatured: (limit = 8) =>
    apiClient.get<ApiEnvelope<ApiReview[]>>('/reviews/featured', { params: { limit } }).then((r) => r.data.data),

  getUserReviews: (userId: string) =>
    apiClient.get<ApiEnvelope<ApiReview[]>>(`/reviews/user/${userId}`).then((r) => r.data.data),

  // NOTE: assumed to be mounted at POST /reviews (root of review.routes.js)
  // based on the sibling routes' naming convention — confirm against
  // review.routes.js if this 404s.
  create: (payload: CreateReviewPayload) =>
    apiClient.post<ApiEnvelope<ApiReview>>('/reviews', payload).then((r) => r.data.data),
};
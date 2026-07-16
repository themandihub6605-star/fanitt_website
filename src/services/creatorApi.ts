import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiSession } from './sessionApi';

export interface ApiCreator {
  _id: string;
  slug: string;
  user: { _id: string; name: string; avatarUrl?: string };
  bio: string;
  category: { _id: string; label: string; icon: string };
  location: string;
  socials: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string };
  followerCount: number;
  averageRating: number;
  reviewCount: number;
  portfolioImages: string[];
}

export interface CreatorDashboardData {
  creatorId: string;
  stats: {
    totalEarnings: number;
    thisMonthEarnings: number;
    followerCount: number;
    averageRating: number;
    reviewCount: number;
  };
  upcomingSessions: ApiSession[];
  recentTransactions: unknown[];
  earningsBreakdown: { _id: string; total: number }[];
}

export const creatorApi = {
  list: (params?: { category?: string; location?: string; search?: string; page?: number }) =>
    apiClient
      .get<ApiEnvelope<{ creators: ApiCreator[]; total: number }>>('/creators', { params })
      .then((r) => r.data.data),

  getBySlug: (slug: string) =>
    apiClient
      .get<ApiEnvelope<{ creator: ApiCreator; sessions: ApiSession[]; reviews: unknown[] }>>(`/creators/${slug}`)
      .then((r) => r.data.data),

  updateMyProfile: (payload: Partial<ApiCreator>) =>
    apiClient.patch<ApiEnvelope<ApiCreator>>('/creators/me', payload).then((r) => r.data.data),

  getMyDashboard: () => apiClient.get<ApiEnvelope<CreatorDashboardData>>('/creators/me/dashboard').then((r) => r.data.data),

  follow: (creatorId: string) =>
    apiClient.post<ApiEnvelope<{ following: boolean }>>(`/creators/${creatorId}/follow`).then((r) => r.data.data),
};
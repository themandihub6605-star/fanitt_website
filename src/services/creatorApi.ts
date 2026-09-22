import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiSession } from './sessionApi';

export interface ApiCreator {
  _id: string;
  slug: string;
  user: { _id: string; name: string; avatarUrl?: string };
  bio: string;
  title?: string;
  category: { _id: string; label: string; icon: string };
  skills?: string[];
  yearsOfExperience?: number | null;
  portfolioLink?: string;
  location: string;
  isAvailableForWork?: boolean;
  isTopCreator?: boolean;
  responseTime?: string;
  languages?: string[];
  onTimeDeliveryPercent?: number;
  socials: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string; behance?: string; website?: string };
  followerCount: number;
  averageRating: number;
  reviewCount: number;
  portfolioImages: string[];
  createdAt?: string;
  projectsCompletedCount?: number;
  // Plan badge shown on listing cards in place of the old blue verified-
  // tick — 'Lite' when no UserSubscription row exists yet (implicit free
  // tier), populated by creator.controller.js's listCreators.
  planName?: string;
  isProPlan?: boolean;
  // Whether the logged-in viewer already follows this creator — computed
  // server-side in listCreators/getCreatorBySlug from req.user, so the UI
  // can show the true Follow/Following state on first load instead of
  // starting empty and guessing from clicks. Undefined for guests.
  isFollowing?: boolean;
  // Admin approval status — gates full dashboard access (see
  // pages/dashboard/CreatorDashboard.tsx's StatusGate).
  verificationStatus?: 'unverified' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export interface CreatorDashboardData {
  creatorId: string;
  stats: {
    totalEarnings: number;
    thisMonthEarnings: number;
    followerCount: number;
    averageRating: number;
    reviewCount: number;
    profileViews: number;
  };
  upcomingSessions: ApiSession[];
  recentTransactions: unknown[];
  earningsBreakdown: { _id: string; total: number }[];
}

export const creatorApi = {
  list: (params?: { category?: string; location?: string; search?: string; page?: number; limit?: number }) =>
    apiClient
      .get<ApiEnvelope<{ creators: ApiCreator[]; total: number; page: number; pages: number }>>('/creators', { params })
      .then((r) => r.data.data),

  getMyProfile: () => apiClient.get<ApiEnvelope<ApiCreator>>('/creators/me').then((r) => r.data.data),

  getBySlug: (slug: string) =>
    apiClient
      .get<ApiEnvelope<{ creator: ApiCreator; sessions: ApiSession[]; reviews: unknown[]; stats: { projectsCompletedCount: number } }>>(`/creators/${slug}`)
      .then((r) => r.data.data),

  updateMyProfile: (payload: Partial<ApiCreator> & { submitForApproval?: boolean }) =>
    apiClient.patch<ApiEnvelope<ApiCreator>>('/creators/me', payload).then((r) => r.data.data),

  getMyDashboard: () => apiClient.get<ApiEnvelope<CreatorDashboardData>>('/creators/me/dashboard').then((r) => r.data.data),

  follow: (creatorId: string) =>
    apiClient.post<ApiEnvelope<{ following: boolean }>>(`/creators/${creatorId}/follow`).then((r) => r.data.data),
};
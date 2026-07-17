import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiCampaign } from './campaignApi';

export interface ApiBrand {
  _id: string;
  slug: string;
  user: { _id: string; name: string; avatarUrl?: string };
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  website?: string;
  industry?: string;
  about?: string;
  location?: string;
  foundedYear?: number | null;
  companySize?: string;
  whatWeOffer?: string[];
  targetAudience?: string;
  contactDesignation?: string;
  socials?: { instagram?: string; facebook?: string; linkedin?: string; youtube?: string };
  followerCount: number;
  profileViews?: number;
  isTopBrand?: boolean;
  onTimePaymentsPercent?: number;
  verificationStatus?: string;
  totalCampaigns: number;
  averageRating: number;
  reviewCount: number;
  createdAt?: string;
}

export interface BrandDashboardData {
  stats: { totalCampaigns: number; totalSpent: number; averageRating: number; profileViews: number };
  campaigns: ApiCampaign[];
  spendBreakdown: { _id: string; total: number }[];
}

export const brandApi = {
  getById: (id: string) => apiClient.get(`/brands/${id}`).then((r) => r.data.data),

  getBySlug: (slug: string) =>
    apiClient
      .get<ApiEnvelope<{ brand: ApiBrand; campaigns: ApiCampaign[]; stats: { campaignsPosted: number } }>>(`/brands/slug/${slug}`)
      .then((r) => r.data.data),

  getMyProfile: () => apiClient.get<ApiEnvelope<ApiBrand>>('/brands/me').then((r) => r.data.data),

  updateMyProfile: (payload: Partial<ApiBrand>) =>
    apiClient.patch<ApiEnvelope<ApiBrand>>('/brands/me', payload).then((r) => r.data.data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post<ApiEnvelope<{ logoUrl: string }>>('/brands/upload-logo', formData).then((r) => r.data.data);
  },

  follow: (brandId: string) =>
    apiClient.post<ApiEnvelope<{ following: boolean }>>(`/brands/${brandId}/follow`).then((r) => r.data.data),

  getMyDashboard: () => apiClient.get<ApiEnvelope<BrandDashboardData>>('/brands/me/dashboard').then((r) => r.data.data),
};

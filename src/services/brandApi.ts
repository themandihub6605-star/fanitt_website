import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiCampaign } from './campaignApi';

export interface BrandDashboardData {
  stats: { totalCampaigns: number; totalSpent: number; averageRating: number };
  campaigns: ApiCampaign[];
  spendBreakdown: { _id: string; total: number }[];
}

export const brandApi = {
  getById: (id: string) => apiClient.get(`/brands/${id}`).then((r) => r.data.data),

  updateMyProfile: (payload: { companyName?: string; logoUrl?: string; website?: string; industry?: string; about?: string }) =>
    apiClient.patch('/brands/me', payload).then((r) => r.data.data),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post<ApiEnvelope<{ logoUrl: string }>>('/brands/upload-logo', formData).then((r) => r.data.data);
  },

  getMyDashboard: () => apiClient.get<ApiEnvelope<BrandDashboardData>>('/brands/me/dashboard').then((r) => r.data.data),
};
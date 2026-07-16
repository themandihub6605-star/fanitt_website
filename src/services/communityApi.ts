import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiCommunity {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category?: { _id: string; label: string; icon: string };
  coverImageUrl: string;
  iconUrl: string;
  isFeatured: boolean;
  memberCount: number;
  discussionCount: number;
}

export const communityApi = {
  list: (params?: { category?: string; search?: string; page?: number }) =>
    apiClient
      .get<ApiEnvelope<{ communities: ApiCommunity[]; total: number }>>('/communities', { params })
      .then((r) => r.data.data),

  getBySlug: (slug: string) => apiClient.get<ApiEnvelope<ApiCommunity>>(`/communities/${slug}`).then((r) => r.data.data),

  create: (payload: { name: string; description?: string; category?: string }) =>
    apiClient.post<ApiEnvelope<ApiCommunity>>('/communities', payload).then((r) => r.data.data),

  toggleJoin: (communityId: string) =>
    apiClient.post<ApiEnvelope<{ joined: boolean }>>(`/communities/${communityId}/join`).then((r) => r.data.data),

  getMine: () => apiClient.get<ApiEnvelope<ApiCommunity[]>>('/communities/me').then((r) => r.data.data),
};
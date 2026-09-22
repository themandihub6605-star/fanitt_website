import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface FollowedEntity {
  id: string;
  type: 'creator' | 'brand';
  slug: string;
  name: string;
  avatarUrl: string | null;
  subtitle: string | null;
}

export const userApi = {
  updateMe: (payload: { name?: string; phone?: string }) =>
    apiClient.patch<ApiEnvelope<{ name: string; phone?: string }>>('/users/me', payload).then((r) => r.data.data),

  /** Uploads the current user's profile photo (used by Fans and Creators — Brands use brandApi.uploadLogo instead). */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.patch<ApiEnvelope<{ avatarUrl: string }>>('/users/me/avatar', formData).then((r) => r.data.data);
  },

  // Every creator/brand the current user follows — the single source of
  // truth for follow-button state everywhere (Feed, profile pages) so it
  // survives a refresh instead of resetting to "not following" every time,
  // and doubles as the data for an actual "Following" list.
  getMyFollowing: () => apiClient.get<ApiEnvelope<FollowedEntity[]>>('/users/me/following').then((r) => r.data.data),
};
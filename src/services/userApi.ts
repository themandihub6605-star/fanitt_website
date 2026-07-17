import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export const userApi = {
  updateMe: (payload: { name?: string; phone?: string }) =>
    apiClient.patch<ApiEnvelope<{ name: string; phone?: string }>>('/users/me', payload).then((r) => r.data.data),

  /** Uploads the current user's profile photo (used by Fans and Creators — Brands use brandApi.uploadLogo instead). */
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.patch<ApiEnvelope<{ avatarUrl: string }>>('/users/me/avatar', formData).then((r) => r.data.data);
  },
};
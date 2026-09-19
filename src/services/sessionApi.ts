import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiSession {
  _id: string;
  title: string;
  description?: string;
  category: { _id: string; label: string; icon: string } | string;
  type: 'free' | 'paid' | 'one_to_one';
  price: number;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  bookedCount: number;
  coverImageUrl?: string;
  zoomMeetingId?: string;
  isLive: boolean;
  isCompleted: boolean;
  isCancelled: boolean;
  creator: {
    _id: string;
    user: { _id: string; name: string; avatarUrl?: string };
  };
}

export interface JoinTokenResponse {
  signature: string;
  meetingNumber: string;
  password: string;
  role: number;
  sdkKey: string;
}

export const sessionApi = {
  list: (params?: { category?: string; type?: string; free?: boolean; page?: number }) =>
    apiClient.get<ApiEnvelope<{ sessions: ApiSession[]; total: number }>>('/sessions', { params }).then((r) => r.data.data),

  getById: (id: string) => apiClient.get<ApiEnvelope<ApiSession>>(`/sessions/${id}`).then((r) => r.data.data),

  create: (payload: {
    title: string;
    description?: string;
    category: string;
    type: 'free' | 'paid' | 'one_to_one';
    price: number;
    scheduledAt: string;
    durationMinutes: number;
    maxParticipants: number;
    coverImageUrl?: string;
  }) => apiClient.post<ApiEnvelope<ApiSession>>('/sessions', payload).then((r) => r.data.data),

  uploadBanner: (file: File) => {
    const formData = new FormData();
    formData.append('banner', file);
    return apiClient
      .post<ApiEnvelope<{ coverImageUrl: string }>>('/sessions/upload-banner', formData)
      .then((r) => r.data.data);
  },

  cancel: (id: string) => apiClient.delete(`/sessions/${id}`),

  getJoinToken: (id: string) =>
    apiClient.get<ApiEnvelope<JoinTokenResponse>>(`/sessions/${id}/join-token`).then((r) => r.data.data),

  goLive: (id: string) => apiClient.patch<ApiEnvelope<ApiSession>>(`/sessions/${id}/go-live`).then((r) => r.data.data),

  endLive: (id: string) => apiClient.patch<ApiEnvelope<ApiSession>>(`/sessions/${id}/end-live`).then((r) => r.data.data),
};
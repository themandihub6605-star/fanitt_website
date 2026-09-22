import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiNotification {
  _id: string;
  type: 'like' | 'follow' | 'comment' | string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  fromUser?: { _id: string; name: string; avatarUrl?: string };
  post?: { _id: string; mediaItems: { url: string; type: 'image' | 'video' }[] };
}

export const notificationApi = {
  getMy: (unreadOnly = false) =>
    apiClient
      .get<ApiEnvelope<{ notifications: ApiNotification[]; unreadCount: number }>>('/notifications/me', {
        params: { unreadOnly },
      })
      .then((r) => r.data.data),

  markAsRead: (id: string) => apiClient.patch(`/notifications/${id}/read`),

  markAllAsRead: () => apiClient.patch('/notifications/read-all'),
};
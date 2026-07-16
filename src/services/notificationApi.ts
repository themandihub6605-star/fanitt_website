import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiNotification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
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

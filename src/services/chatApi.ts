import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiConversation {
  _id: string;
  participants: { _id: string; name: string; avatarUrl?: string; role: string }[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ApiMessage {
  _id: string;
  conversation: string;
  sender: string;
  text: string;
  isRead: boolean;
  createdAt: string;
}

export const chatApi = {
  listConversations: () => apiClient.get<ApiEnvelope<ApiConversation[]>>('/chat/conversations').then((r) => r.data.data),

  startConversation: (userId: string) =>
    apiClient.post<ApiEnvelope<ApiConversation>>('/chat/conversations', { userId }).then((r) => r.data.data),

  getMessages: (conversationId: string) =>
    apiClient.get<ApiEnvelope<ApiMessage[]>>(`/chat/conversations/${conversationId}/messages`).then((r) => r.data.data),

  sendMessage: (conversationId: string, text: string) =>
    apiClient.post<ApiEnvelope<ApiMessage>>(`/chat/conversations/${conversationId}/messages`, { text }).then((r) => r.data.data),
};
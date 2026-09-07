import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiConversation {
  _id: string;
  participants: { _id: string; name: string; avatarUrl?: string; role: string }[];
  application?: string | null;
  campaign?: string | null;
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

  // For any pair OTHER than creator<->brand (fan<->creator, etc). The
  // backend rejects this with errorCode 'PROPOSAL_ONLY_MESSAGING' if the
  // two roles involved are creator and brand — use
  // startConversationForApplication for that pair instead.
  startConversation: (userId: string) =>
    apiClient.post<ApiEnvelope<ApiConversation>>('/chat/conversations', { userId }).then((r) => r.data.data),

  // Brand-only — creates (or fetches, if it already exists) the one
  // conversation tied to this proposal. A creator calling this gets a
  // 403; they use getConversationForApplication instead, once the brand
  // has replied.
  startConversationForApplication: (applicationId: string) =>
    apiClient.post<ApiEnvelope<ApiConversation>>(`/chat/applications/${applicationId}/start`).then((r) => r.data.data),

  // Returns null if the brand hasn't replied to this proposal yet — the
  // creator's side uses this to check before trying to open a chat.
  getConversationForApplication: (applicationId: string) =>
    apiClient.get<ApiEnvelope<ApiConversation | null>>(`/chat/applications/${applicationId}`).then((r) => r.data.data),

  getMessages: (conversationId: string) =>
    apiClient.get<ApiEnvelope<ApiMessage[]>>(`/chat/conversations/${conversationId}/messages`).then((r) => r.data.data),

  sendMessage: (conversationId: string, text: string) =>
    apiClient.post<ApiEnvelope<ApiMessage>>(`/chat/conversations/${conversationId}/messages`, { text }).then((r) => r.data.data),
};
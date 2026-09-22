import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface PostMediaItem {
  url: string;
  type: 'image' | 'video';
}

export interface LikePreviewUser {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export interface ApiPost {
  _id: string;
  creator:
    | {
        _id: string;
        slug: string;
        user: { _id: string; name: string; avatarUrl?: string };
        isFollowing?: boolean;
      }
    | string;
  mediaItems: PostMediaItem[];
  caption: string;
  likedBy: string[];
  likeCount: number;
  likePreview?: LikePreviewUser[];
  createdAt: string;
}

export const MAX_POSTS_PER_CREATOR = 5;
export const MAX_MEDIA_PER_POST = 5;

export interface PostLike {
  _id: string;
  name: string;
  avatarUrl?: string;
}

export const postApi = {
  create: (files: File[], caption?: string) => {
    const formData = new FormData();
    files.forEach((f) => formData.append('media', f));
    if (caption) formData.append('caption', caption);
    return apiClient.post<ApiEnvelope<ApiPost>>('/posts', formData).then((r) => r.data.data);
  },

  getByCreator: (creatorId: string) => apiClient.get<ApiEnvelope<ApiPost[]>>(`/posts/creator/${creatorId}`).then((r) => r.data.data),

  getMy: () => apiClient.get<ApiEnvelope<ApiPost[]>>('/posts/me').then((r) => r.data.data),

  getFeed: (limit = 12) => apiClient.get<ApiEnvelope<ApiPost[]>>('/posts/feed', { params: { limit } }).then((r) => r.data.data),

  toggleLike: (postId: string) =>
    apiClient.post<ApiEnvelope<{ liked: boolean; likeCount: number }>>(`/posts/${postId}/like`).then((r) => r.data.data),

  getLikes: (postId: string) => apiClient.get<ApiEnvelope<PostLike[]>>(`/posts/${postId}/likes`).then((r) => r.data.data),

  update: (postId: string, caption: string) =>
    apiClient.patch<ApiEnvelope<ApiPost>>(`/posts/${postId}`, { caption }).then((r) => r.data.data),

  remove: (postId: string) => apiClient.delete(`/posts/${postId}`),
};
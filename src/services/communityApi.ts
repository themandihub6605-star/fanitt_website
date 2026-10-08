import { apiClient } from './apiClient';
import type { ApiEnvelope, Role } from '@/types/api';

export type CommunityRole = 'member' | 'moderator' | 'admin';
export type MembershipStatus = 'active' | 'pending' | 'banned' | 'expired';
export type CommunityPlanKey = 'monthly' | 'yearly' | 'lifetime';

/** A plan the owner turned on — price in paise. */
export interface CommunityPlanOption {
  key: CommunityPlanKey;
  label: string;
  price: number;
}

export type CommunityPlans = Partial<Record<CommunityPlanKey, { enabled: boolean; price: number }>>;

export interface CommunityMembership {
  role: CommunityRole;
  status: MembershipStatus;
  notificationsMuted: boolean;
  /** free = joined while it was free; paid = bought a plan. */
  access?: 'free' | 'paid';
  plan?: CommunityPlanKey | null;
  paidUntil?: string | null;
}
export type CommunityVisibility = 'public' | 'private';
export type PostPermission = 'all' | 'moderators';
export type CommunitySort = 'trending' | 'popular' | 'new';

export interface CommunityUser {
  _id: string;
  name: string;
  avatarUrl?: string;
  role?: Role;
}

export interface ApiCommunity {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category?: { _id: string; label: string; icon: string } | null;
  coverImageUrl: string;
  iconUrl: string;
  rules: string[];
  visibility: CommunityVisibility;
  postPermission: PostPermission;
  chatEnabled: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  memberCount: number;
  discussionCount: number;
  pendingRequestCount?: number;
  lastActivityAt?: string;
  createdAt: string;
  createdBy?: CommunityUser | string;
  membership: CommunityMembership | null;
  // Paid community
  isPaid?: boolean;
  plans?: CommunityPlans;
  planOptions?: CommunityPlanOption[];
  /** Owner only. */
  paidStats?: { revenue: number; payments: number };
  canPost: boolean;
  canModerate: boolean;
  isOwner: boolean;
  unreadChatCount?: number;
  moderators?: { user: CommunityUser; role: CommunityRole }[];
}

export interface CommunityPoll {
  question: string;
  options: { text: string; votes: number }[];
  totalVotes: number;
  endsAt: string | null;
  myVote: number | null;
  isClosed: boolean;
}

export interface CommunityPost {
  _id: string;
  community: string | ApiCommunity;
  author: CommunityUser;
  text: string;
  mediaItems: { url: string; type: 'image' | 'video' }[];
  poll: CommunityPoll | null;
  isAnnouncement: boolean;
  isPinned: boolean;
  /** Paid communities: free preview post anyone can read without a plan. */
  isFree?: boolean;
  /** Paid post shown locked (no plan): text is only the first line, teaserImage a tiny blurred data URI. */
  isLocked?: boolean;
  teaserImage?: string;
  mediaCount?: number;
  hasVideo?: boolean;
  hasPoll?: boolean;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  mentions: string[];
  editedAt: string | null;
  createdAt: string;
}

export interface CommunityComment {
  _id: string;
  post: string;
  author: CommunityUser;
  parentComment: string | null;
  text: string;
  likeCount: number;
  replyCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: CommunityComment[];
}

export interface CommunityMember {
  user: CommunityUser;
  role: CommunityRole;
  status: MembershipStatus;
  joinedAt: string;
}

export interface CommunityMessage {
  _id: string;
  community: string;
  sender: CommunityUser;
  text: string;
  isRemoved: boolean;
  createdAt: string;
}

export interface Paged<T> {
  total: number;
  page: number;
  pages: number;
  items: T[];
}

export type MemberAction = 'approve' | 'reject' | 'make_moderator' | 'remove_moderator' | 'remove' | 'ban' | 'unban';

export interface CommunityFormPayload {
  name?: string;
  description?: string;
  category?: string;
  visibility?: CommunityVisibility;
  postPermission?: PostPermission;
  chatEnabled?: boolean;
  rules?: string[];
  icon?: File | null;
  cover?: File | null;
  isPaid?: boolean;
  plans?: Record<CommunityPlanKey, { enabled: boolean; price: number }>;
}

/** What the create / edit form needs to know. */
export interface CommunityConfig {
  requireSubscription: boolean;
  hasSubscription: boolean;
  planName: string;
  paidCommunitiesEnabled: boolean;
  canSell: boolean;
  feePercent: number;
  minPrice: number;
  maxPrice: number;
}

/** Store checkout started for a plan (Razorpay unless it was free). */
export interface CommunityCheckout {
  order: { _id: string; amount: number; status: string };
  paid: boolean;
  razorpay: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    prefill?: { name?: string; email?: string; contact?: string };
  } | null;
}

export interface NewPostPayload {
  text: string;
  media: File[];
  poll?: { question: string; options: string[]; durationHours: number } | null;
  isAnnouncement?: boolean;
  /** Paid communities only — owner / moderators, max 3. */
  isFree?: boolean;
  mentions?: string[];
}

function toFormData(payload: CommunityFormPayload) {
  const form = new FormData();
  if (payload.name !== undefined) form.append('name', payload.name);
  if (payload.description !== undefined) form.append('description', payload.description);
  if (payload.category !== undefined) form.append('category', payload.category);
  if (payload.visibility) form.append('visibility', payload.visibility);
  if (payload.postPermission) form.append('postPermission', payload.postPermission);
  if (payload.chatEnabled !== undefined) form.append('chatEnabled', String(payload.chatEnabled));
  if (payload.rules) form.append('rules', JSON.stringify(payload.rules));
  if (payload.icon) form.append('icon', payload.icon);
  if (payload.cover) form.append('cover', payload.cover);
  if (payload.isPaid !== undefined) form.append('isPaid', String(payload.isPaid));
  if (payload.plans) form.append('plans', JSON.stringify(payload.plans));
  return form;
}

export const communityApi = {
  // Communities
  list: (params?: { category?: string; search?: string; sort?: CommunitySort; page?: number; featured?: boolean }) =>
    apiClient
      .get<ApiEnvelope<{ communities: ApiCommunity[]; total: number; page: number; pages: number }>>('/communities', { params })
      .then((r) => r.data.data),

  getMine: () => apiClient.get<ApiEnvelope<ApiCommunity[]>>('/communities/me').then((r) => r.data.data),

  getBySlug: (slugOrId: string) => apiClient.get<ApiEnvelope<ApiCommunity>>(`/communities/${slugOrId}`).then((r) => r.data.data),

  create: (payload: CommunityFormPayload) =>
    apiClient.post<ApiEnvelope<ApiCommunity>>('/communities', toFormData(payload)).then((r) => r.data.data),

  update: (id: string, payload: CommunityFormPayload) =>
    apiClient.patch<ApiEnvelope<ApiCommunity>>(`/communities/${id}`, toFormData(payload)).then((r) => r.data.data),

  remove: (id: string) => apiClient.delete(`/communities/${id}`),

  toggleJoin: (id: string) =>
    apiClient
      .post<ApiEnvelope<{ joined: boolean; status: MembershipStatus | null }>>(`/communities/${id}/join`)
      .then((r) => r.data.data),

  config: () => apiClient.get<ApiEnvelope<CommunityConfig>>('/communities/config').then((r) => r.data.data),

  /** Starts buying a plan of a paid community. */
  checkout: (id: string, plan: CommunityPlanKey) =>
    apiClient.post<ApiEnvelope<CommunityCheckout>>(`/communities/${id}/checkout`, { plan, payWith: 'razorpay' }).then((r) => r.data.data),

  /** Confirms a Razorpay payment (same endpoint as every Fanitt Store order). */
  verifyPayment: (orderId: string, payment: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    apiClient.post(`/store/orders/${orderId}/verify`, payment).then((r) => r.data.data),

  setMuted: (id: string, notificationsMuted: boolean) =>
    apiClient.patch(`/communities/${id}/me`, { notificationsMuted }).then((r) => r.data.data),

  // Members
  members: (id: string, params?: { status?: MembershipStatus; search?: string; page?: number }) =>
    apiClient
      .get<ApiEnvelope<{ members: CommunityMember[]; total: number; page: number; pages: number }>>(`/communities/${id}/members`, { params })
      .then((r) => r.data.data),

  manageMember: (id: string, userId: string, action: MemberAction) =>
    apiClient.patch(`/communities/${id}/members/${userId}`, { action }).then((r) => r.data.data),

  // Posts
  posts: (id: string, params?: { page?: number; sort?: 'new' | 'top'; announcements?: boolean }) =>
    apiClient
      .get<
        ApiEnvelope<{
          posts: CommunityPost[];
          locked?: CommunityPost[];
          total: number;
          page: number;
          pages: number;
          preview?: boolean;
          lockedCount?: number;
          freeCount?: number;
        }>
      >(`/communities/${id}/posts`, { params })
      .then((r) => r.data.data),

  createPost: (id: string, payload: NewPostPayload) => {
    const form = new FormData();
    form.append('text', payload.text);
    payload.media.forEach((file) => form.append('media', file));
    if (payload.poll) form.append('poll', JSON.stringify(payload.poll));
    if (payload.isAnnouncement) form.append('isAnnouncement', 'true');
    if (payload.isFree) form.append('isFree', 'true');
    if (payload.mentions?.length) form.append('mentions', JSON.stringify(payload.mentions));
    return apiClient.post<ApiEnvelope<CommunityPost>>(`/communities/${id}/posts`, form).then((r) => r.data.data);
  },

  getPost: (postId: string) =>
    apiClient
      .get<ApiEnvelope<CommunityPost & { community: ApiCommunity }>>(`/communities/posts/${postId}`)
      .then((r) => r.data.data),

  updatePost: (postId: string, text: string) =>
    apiClient.patch<ApiEnvelope<CommunityPost>>(`/communities/posts/${postId}`, { text }).then((r) => r.data.data),

  deletePost: (postId: string) => apiClient.delete(`/communities/posts/${postId}`),

  likePost: (postId: string) =>
    apiClient
      .post<ApiEnvelope<{ liked: boolean; likeCount: number }>>(`/communities/posts/${postId}/like`)
      .then((r) => r.data.data),

  pinPost: (postId: string) =>
    apiClient.post<ApiEnvelope<{ isPinned: boolean }>>(`/communities/posts/${postId}/pin`).then((r) => r.data.data),

  /** Open a paid community's post to everyone, or back to members only. */
  setPostFree: (postId: string, isFree: boolean) =>
    apiClient
      .post<ApiEnvelope<{ isFree: boolean; freeCount: number; maxFree: number }>>(`/communities/posts/${postId}/free`, { isFree })
      .then((r) => r.data.data),

  vote: (postId: string, optionIndex: number) =>
    apiClient.post<ApiEnvelope<CommunityPoll>>(`/communities/posts/${postId}/vote`, { optionIndex }).then((r) => r.data.data),

  // Comments
  comments: (postId: string, page = 1) =>
    apiClient
      .get<ApiEnvelope<{ comments: CommunityComment[]; total: number; page: number; pages: number }>>(
        `/communities/posts/${postId}/comments`,
        { params: { page } }
      )
      .then((r) => r.data.data),

  addComment: (postId: string, text: string, parentId?: string | null, mentions: string[] = []) =>
    apiClient
      .post<ApiEnvelope<CommunityComment>>(`/communities/posts/${postId}/comments`, { text, parentId, mentions })
      .then((r) => r.data.data),

  deleteComment: (commentId: string) =>
    apiClient.delete<ApiEnvelope<{ removed: number }>>(`/communities/comments/${commentId}`).then((r) => r.data.data),

  likeComment: (commentId: string) =>
    apiClient
      .post<ApiEnvelope<{ liked: boolean; likeCount: number }>>(`/communities/comments/${commentId}/like`)
      .then((r) => r.data.data),

  // Chat
  chat: (id: string, before?: string) =>
    apiClient
      .get<ApiEnvelope<{ messages: CommunityMessage[]; hasMore: boolean }>>(`/communities/${id}/chat`, { params: { before } })
      .then((r) => r.data.data),

  sendChat: (id: string, text: string) =>
    apiClient.post<ApiEnvelope<CommunityMessage>>(`/communities/${id}/chat`, { text }).then((r) => r.data.data),

  markChatRead: (id: string) => apiClient.post(`/communities/${id}/chat/read`),

  deleteChat: (id: string, messageId: string) => apiClient.delete(`/communities/${id}/chat/${messageId}`),
};

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const PLAN_SUFFIX: Record<CommunityPlanKey, string> = { monthly: '/month', yearly: '/year', lifetime: ' once' };

export function rupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

/** "₹199/month" for the cheapest plan, or '' for free communities. */
export function communityPriceLabel(c: ApiCommunity) {
  const plans = c.planOptions || [];
  if (!c.isPaid || plans.length === 0) return '';
  const cheapest = [...plans].sort((a, b) => a.price - b.price)[0];
  return `${rupees(cheapest.price)}${PLAN_SUFFIX[cheapest.key]}`;
}

/** Paid community and this viewer still has to buy a plan. */
export function needsPlan(c: ApiCommunity) {
  const status = c.membership?.status;
  return Boolean(c.isPaid && !c.isOwner && status !== 'active' && status !== 'banned');
}
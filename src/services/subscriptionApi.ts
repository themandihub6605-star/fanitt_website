import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export type BillingCycle = 'monthly' | 'yearly';

export interface ApiSubscriptionPlan {
  _id: string;
  name: string;
  slug: string;
  appliesTo: 'creator' | 'brand';
  price: number; // paise, 0 = free
  billingCycle: BillingCycle;
  billingGroupSlug: string; // links monthly/yearly variants of the same tier — see backend model comment
  isDefault: boolean;
  proposalLimit: number | null;
  extraProposalCost: number;
  platformFeePercent: number;
  campaignAccessTier: 'lite_only' | 'all';
  hasEarlyAccess: boolean;
  campaignPostLimit: number | null;
  campaignVisibilityTier: 'lite' | 'exclusive';
  canSetApplicantLimit: boolean;
  isFeaturedListing: boolean;
  description: string;
  perks: string[];
}

export interface ApiUserSubscription {
  _id: string;
  plan: ApiSubscriptionPlan;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  proposalsUsedThisCycle: number;
  campaignsPostedThisCycle: number;
}

export interface SubscriptionCheckoutResponse {
  razorpaySubscriptionId: string;
  razorpayKeyId: string;
}

export const subscriptionApi = {
  listPlans: (appliesTo?: 'creator' | 'brand') =>
    apiClient.get<ApiEnvelope<ApiSubscriptionPlan[]>>('/subscriptions/plans', { params: { appliesTo } }).then((r) => r.data.data),

  getMySubscription: () => apiClient.get<ApiEnvelope<ApiUserSubscription>>('/subscriptions/me').then((r) => r.data.data),

  createCheckout: (planId: string) =>
    apiClient.post<ApiEnvelope<SubscriptionCheckoutResponse>>('/subscriptions/checkout', { planId }).then((r) => r.data.data),

  verifyCheckout: (payload: { razorpaySubscriptionId: string; razorpayPaymentId: string; razorpaySignature: string; planId: string }) =>
    apiClient.post<ApiEnvelope<ApiUserSubscription>>('/subscriptions/verify', payload).then((r) => r.data.data),

  cancelSubscription: () => apiClient.post<ApiEnvelope<ApiUserSubscription>>('/subscriptions/cancel').then((r) => r.data.data),
};
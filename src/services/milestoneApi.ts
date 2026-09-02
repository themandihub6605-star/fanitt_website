import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export type MilestoneStatus = 'pending' | 'funded' | 'submitted' | 'released';

export interface ApiMilestone {
  _id: string;
  campaign: string;
  creator: string;
  title: string;
  amount: number; // paise
  order: number; // 1 = advance, 2 = final
  isAdvance: boolean;
  status: MilestoneStatus;
  submittedWorkUrl?: string;
  submittedAt?: string | null;
  fundedAt?: string | null;
  releasedAt?: string | null;
  autoReleaseAt?: string | null;
  createdAt: string;
}

export const milestoneApi = {
  getForCampaign: (campaignId: string) =>
    apiClient.get<ApiEnvelope<ApiMilestone[]>>(`/campaigns/${campaignId}/milestones`).then((r) => r.data.data),

  initiateFunding: (milestoneId: string) =>
    apiClient
      .post<ApiEnvelope<{ order: RazorpayOrder }>>(`/milestones/${milestoneId}/fund`)
      .then((r) => r.data.data),

  verifyFunding: (
    milestoneId: string,
    payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  ) => apiClient.post<ApiEnvelope<ApiMilestone>>(`/milestones/${milestoneId}/verify-payment`, payload).then((r) => r.data.data),

  submitWork: (milestoneId: string, workUrl: string) =>
    apiClient.patch<ApiEnvelope<ApiMilestone>>(`/milestones/${milestoneId}/submit`, { workUrl }).then((r) => r.data.data),

  approve: (milestoneId: string) => apiClient.patch(`/milestones/${milestoneId}/approve`),
};
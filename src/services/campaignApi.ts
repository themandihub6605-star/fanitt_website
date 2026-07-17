import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export interface ApiCampaign {
  _id: string;
  title: string;
  description: string;
  category: { _id: string; label: string; icon: string };
  budget: number;
  durationLabel: string;
  location: string;
  creatorRequirement: string;
  status: string;
  brand: { _id: string; companyName: string; logoUrl?: string; user: { _id: string; name: string; avatarUrl?: string } };
  assignedCreator?: { _id: string; user: { _id: string; name: string; avatarUrl?: string } } | null;
  applicantCount: number;
  isEscrowFunded: boolean;
  isEscrowReleased: boolean;
  submittedWorkUrl?: string;
  createdAt: string;
}

export interface ApiApplication {
  _id: string;
  campaign: string;
  creator: { _id: string; user: { name: string; avatarUrl?: string } };
  pitch: string;
  quotedAmount?: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ApiProposal {
  _id: string;
  campaign: ApiCampaign;
  pitch: string;
  quotedAmount?: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  feedback?: string;
  createdAt: string;
}

export interface ProposalCounts {
  all: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export const campaignApi = {
  list: (params?: { category?: string; status?: string; page?: number }) =>
    apiClient
      .get<ApiEnvelope<{ campaigns: ApiCampaign[]; total: number }>>('/campaigns', { params })
      .then((r) => r.data.data),

  getById: (id: string) => apiClient.get<ApiEnvelope<ApiCampaign>>(`/campaigns/${id}`).then((r) => r.data.data),

  create: (payload: {
    title: string;
    description: string;
    category: string;
    budget: number;
    durationLabel?: string;
    location?: string;
    creatorRequirement?: string;
  }) => apiClient.post<ApiEnvelope<ApiCampaign>>('/campaigns', payload).then((r) => r.data.data),

  apply: (campaignId: string, payload: { pitch?: string; quotedAmount?: number; deliverables?: string[] }) =>
    apiClient.post<ApiEnvelope<ApiApplication>>(`/campaigns/${campaignId}/apply`, payload).then((r) => r.data.data),

  getMyProposals: (status?: string) =>
    apiClient
      .get<ApiEnvelope<{ proposals: ApiProposal[]; counts: ProposalCounts }>>('/campaigns/proposals/me', {
        params: status ? { status } : undefined,
      })
      .then((r) => r.data.data),

  getApplications: (campaignId: string) =>
    apiClient.get<ApiEnvelope<ApiApplication[]>>(`/campaigns/${campaignId}/applications`).then((r) => r.data.data),

  decideApplication: (campaignId: string, appId: string, decision: 'accepted' | 'rejected', feedback?: string) =>
    apiClient.patch(`/campaigns/${campaignId}/applications/${appId}`, { decision, feedback }),

  toggleSave: (campaignId: string) =>
    apiClient.post<ApiEnvelope<{ saved: boolean }>>(`/campaigns/${campaignId}/save`).then((r) => r.data.data),

  getSaved: () => apiClient.get<ApiEnvelope<ApiCampaign[]>>('/campaigns/saved/me').then((r) => r.data.data),

  initiateEscrowFunding: (campaignId: string) =>
    apiClient
      .post<ApiEnvelope<{ order: RazorpayOrder }>>(`/campaigns/${campaignId}/fund-escrow`)
      .then((r) => r.data.data),

  verifyEscrowPayment: (
    campaignId: string,
    payload: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  ) => apiClient.post(`/campaigns/${campaignId}/verify-escrow-payment`, payload),

  submitWork: (campaignId: string, workUrl: string) => apiClient.patch(`/campaigns/${campaignId}/submit`, { workUrl }),

  approveWork: (campaignId: string) => apiClient.patch(`/campaigns/${campaignId}/approve`),
};
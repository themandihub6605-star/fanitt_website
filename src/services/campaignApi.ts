import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export type CampaignType = 'paid' | 'barter';
export type LocationType = 'pan_india' | 'state' | 'city';
export type GenderTarget = 'male' | 'female' | 'other';

export interface ApiCampaignProduct {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface ApiCampaign {
  _id: string;
  title: string;
  description: string;
  category?: { _id: string; label: string; icon: string } | null;
  campaignType: CampaignType;
  costPerInfluencer: number;
  budget: number;
  products: ApiCampaignProduct[];
  durationLabel: string;
  location: string;
  locationType: LocationType;
  locationValue: string;
  creatorRequirement: string;
  influencerCategories: string[];
  genderTarget: GenderTarget[];
  ageRange: { min: number; max: number };
  minFollowers?: number | null;
  maxInfluencers: number;
  dos: string[];
  donts: string[];
  campaignImageUrl: string;
  sampleMedia: string[];
  deliverables: { reel: number; story: number; post: number };
  status: 'draft' | 'open' | 'in_progress' | 'submitted' | 'approved' | 'completed' | 'disputed' | 'cancelled';
  publishedAt?: string | null;
  brand: {
    _id: string;
    companyName: string;
    logoUrl?: string;
    slug?: string;
    user: { _id: string; name: string; avatarUrl?: string };
  };
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
  creator: { _id: string; user: { _id: string; name: string; avatarUrl?: string } };
  pitch: string;
  quotedAmount?: number | null;
  portfolioLinks?: string[];
  deliveryTimeline?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface ApiProposal {
  _id: string;
  campaign: ApiCampaign;
  pitch: string;
  quotedAmount?: number | null;
  portfolioLinks?: string[];
  deliveryTimeline?: string;
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

export interface DraftCampaignPayload {
  title: string;
  campaignType: CampaignType;
  locationType: LocationType;
  locationValue?: string;
}

export interface UpdateDraftPayload {
  title?: string;
  campaignType?: CampaignType;
  locationType?: LocationType;
  locationValue?: string;
  costPerInfluencer?: number;
  description?: string;
  category?: string;
  creatorRequirement?: string;
  durationLabel?: string;
  influencerCategories?: string[];
  genderTarget?: GenderTarget[];
  ageRange?: { min: number; max: number };
  minFollowers?: number;
  maxInfluencers?: number;
  dos?: string[];
  donts?: string[];
  deliverables?: { reel?: number; story?: number; post?: number };
}

export interface ApplyPayload {
  pitch?: string;
  quotedAmount?: number;
  portfolioLinks?: string[];
  deliveryTimeline?: string;
}

export const campaignApi = {
  list: (params?: { category?: string; status?: string; page?: number }) =>
    apiClient
      .get<ApiEnvelope<{ campaigns: ApiCampaign[]; total: number }>>('/campaigns', { params })
      .then((r) => r.data.data),

  getById: (id: string) => apiClient.get<ApiEnvelope<ApiCampaign>>(`/campaigns/${id}`).then((r) => r.data.data),

  createDraft: (payload: DraftCampaignPayload) =>
    apiClient.post<ApiEnvelope<ApiCampaign>>('/campaigns/draft', payload).then((r) => r.data.data),

  getDraft: (id: string) => apiClient.get<ApiEnvelope<ApiCampaign>>(`/campaigns/${id}/draft`).then((r) => r.data.data),

  updateDraft: (id: string, payload: UpdateDraftPayload) =>
    apiClient.patch<ApiEnvelope<ApiCampaign>>(`/campaigns/${id}`, payload).then((r) => r.data.data),

  addProduct: (
    id: string,
    payload: { name: string; description?: string; quantity: number; price: number },
    imageFile?: File | null
  ) => {
    const formData = new FormData();
    formData.append('name', payload.name);
    if (payload.description) formData.append('description', payload.description);
    formData.append('quantity', String(payload.quantity));
    formData.append('price', String(payload.price));
    if (imageFile) formData.append('image', imageFile);
    return apiClient
      .post<ApiEnvelope<ApiCampaignProduct>>(`/campaigns/${id}/products`, formData)
      .then((r) => r.data.data);
  },

  removeProduct: (id: string, productId: string) => apiClient.delete(`/campaigns/${id}/products/${productId}`),

  uploadMedia: (id: string, files: { campaignImage?: File | null; media?: File[] }) => {
    const formData = new FormData();
    if (files.campaignImage) formData.append('campaignImage', files.campaignImage);
    (files.media || []).forEach((f) => formData.append('media', f));
    return apiClient
      .post<ApiEnvelope<{ campaignImageUrl: string; sampleMedia: string[] }>>(`/campaigns/${id}/media`, formData)
      .then((r) => r.data.data);
  },

  publish: (id: string) => apiClient.post<ApiEnvelope<ApiCampaign>>(`/campaigns/${id}/publish`).then((r) => r.data.data),

  apply: (campaignId: string, payload: ApplyPayload) =>
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
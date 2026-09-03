import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { RazorpayOrder } from './bookingApi';

export type MilestoneStatus = 'pending' | 'funded' | 'submitted' | 'changes_requested' | 'disputed' | 'released';

export interface ApiAttachment {
  name: string;
  url: string;
}

export interface ApiMilestone {
  _id: string;
  campaign: string;
  creator: string;
  title: string;
  amount: number; // paise
  order: number; // 1-based
  isAdvance: boolean;
  status: MilestoneStatus;

  submissionDescription?: string;
  submissionLinks?: string[];
  submissionAttachments?: ApiAttachment[];
  submittedAt?: string | null;

  changeDescription?: string;
  changeReferenceLinks?: string[];
  changeAttachments?: ApiAttachment[];
  changesRequestedAt?: string | null;

  dispute?: string | null;

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

  // Creator's work submission (also used to resubmit after a change
  // request) — multipart so files can ride along with description/links.
  submitWork: (milestoneId: string, payload: { description: string; links: string[]; files: File[] }) => {
    const formData = new FormData();
    formData.append('description', payload.description);
    formData.append('links', JSON.stringify(payload.links.filter(Boolean)));
    payload.files.forEach((f) => formData.append('files', f));
    return apiClient
      .patch<ApiEnvelope<ApiMilestone>>(`/milestones/${milestoneId}/submit`, formData)
      .then((r) => r.data.data);
  },

  approve: (milestoneId: string) => apiClient.patch(`/milestones/${milestoneId}/approve`),

  // Brand asks for a revision instead of approving — no money moves.
  requestChanges: (
    milestoneId: string,
    payload: { changeDescription: string; referenceLinks: string[]; files: File[] }
  ) => {
    const formData = new FormData();
    formData.append('changeDescription', payload.changeDescription);
    formData.append('referenceLinks', JSON.stringify(payload.referenceLinks.filter(Boolean)));
    payload.files.forEach((f) => formData.append('files', f));
    return apiClient
      .patch<ApiEnvelope<ApiMilestone>>(`/milestones/${milestoneId}/request-changes`, formData)
      .then((r) => r.data.data);
  },

  // Brand escalates to Fanitt admin instead of approving/requesting changes.
  raiseDispute: (milestoneId: string, payload: { reason: string; files: File[] }) => {
    const formData = new FormData();
    formData.append('reason', payload.reason);
    payload.files.forEach((f) => formData.append('files', f));
    return apiClient.post(`/milestones/${milestoneId}/dispute`, formData);
  },
};
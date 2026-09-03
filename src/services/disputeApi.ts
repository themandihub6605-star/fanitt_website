import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiAttachment, ApiMilestone } from './milestoneApi';

export type DisputeStatus = 'open' | 'resolved';
export type DisputeOutcome = 'full_to_creator' | 'partial' | 'refund_to_brand' | 'revision_required';

export interface ApiDispute {
  _id: string;
  campaign: { _id: string; title: string; budget: number; brand: { companyName: string } };
  milestone: ApiMilestone;
  raisedBy: { name: string; email: string };
  reason: string;
  attachments: ApiAttachment[];
  status: DisputeStatus;
  resolution?: {
    outcome: DisputeOutcome | null;
    creatorAmount: number | null;
    brandRefundAmount: number | null;
    adminNotes: string;
    resolvedAt: string | null;
  };
  createdAt: string;
}

export const disputeApi = {
  listOpen: () => apiClient.get<ApiEnvelope<ApiDispute[]>>('/disputes').then((r) => r.data.data),

  getById: (id: string) => apiClient.get<ApiEnvelope<ApiDispute>>(`/disputes/${id}`).then((r) => r.data.data),

  resolve: (id: string, payload: { outcome: DisputeOutcome; creatorAmount?: number; adminNotes?: string }) =>
    apiClient.patch<ApiEnvelope<ApiDispute>>(`/disputes/${id}/resolve`, payload).then((r) => r.data.data),
};
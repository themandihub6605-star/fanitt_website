import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';
import type { ApiAgency } from './agencyApi';

/** Admin-only endpoints. Scoped to agency approval for now — the backend has
 * more (user suspension, content moderation, escrow disputes, analytics) but
 * there's no frontend for any of that yet. */
export const adminApi = {
  listAgencies: (status?: 'pending' | 'verified' | 'rejected' | 'unverified') =>
    apiClient.get<ApiEnvelope<ApiAgency[]>>('/admin/agencies', { params: { status } }).then((r) => r.data.data),

  verifyAgency: (id: string, decision: 'verified' | 'rejected', rejectionReason?: string) =>
    apiClient.patch<ApiEnvelope<ApiAgency>>(`/admin/agencies/${id}/verify`, { decision, rejectionReason }).then((r) => r.data.data),
};

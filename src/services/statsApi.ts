import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface PublicStats {
  sessionsBooked: number;
  activeCreators: number;
  activeBrands: number;
  totalPaidOut: number; // paise
}

export const statsApi = {
  getPublic: () => apiClient.get<ApiEnvelope<PublicStats>>('/stats/public').then((r) => r.data.data),
};

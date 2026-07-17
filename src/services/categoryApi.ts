import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiCategory {
  _id: string;
  label: string;
  slug: string;
  icon: string;
}

export const categoryApi = {
  list: () => apiClient.get<ApiEnvelope<ApiCategory[]>>('/categories').then((r) => r.data.data),
};

import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

// Public Fanitt Store settings (set from the admin panel).

export interface StoreWebBanner {
  enabled: boolean;
  imageUrl: string;
  title: string;
  subtitle: string;
  buttonText: string;
  playStoreUrl: string;
  appDeepLink: string;
}

export interface StorePublicConfig {
  storeFeePercent: number;
  fanboxFeePercent: number;
  /** null when the admin has the banner switched off. */
  webBanner: StoreWebBanner | null;
}

export const storeConfigApi = {
  get: () => apiClient.get<ApiEnvelope<StorePublicConfig>>('/store/config').then((r) => r.data.data),
};
import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

// Privacy Policy / Terms of Use — the same text the app shows
// (backend: GET /api/legal/:slug).

export interface LegalBlock {
  type: 'p' | 'h' | 'li' | 'ol';
  text: string;
  n?: number;
}

export interface LegalSection {
  id: string;
  number: string;
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  slug: string;
  title: string;
  subtitle: string;
  updated: string;
  effective: string;
  intro: LegalBlock[];
  sections: LegalSection[];
}

export const legalApi = {
  get: (slug: 'privacy-policy' | 'terms-of-use') => apiClient.get<ApiEnvelope<LegalDoc>>(`/legal/${slug}`).then((r) => r.data.data),
};
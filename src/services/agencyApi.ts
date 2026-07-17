import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface ApiAgency {
  _id: string;
  user: { _id: string; name: string; email: string; avatarUrl?: string };
  agencyName: string;
  ownerName?: string;
  mobile?: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  teamSize?: string;
  yearsInBusiness?: number | null;
  specialization?: string;
  documentUrl?: string;
  logoUrl?: string;
  referralCode: string;
  commissionPercent: number;
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
  totalCommissionEarned: number;
  thisMonthCommission: number;
  createdAt: string;
}

export interface AgencyDashboardData {
  stats: {
    totalReferrals: number;
    referredCreatorCount: number;
    referredBrandCount: number;
    totalCommissionEarned: number;
    thisMonthCommission: number;
    walletBalance: number;
    referralCode: string;
    verificationStatus: ApiAgency['verificationStatus'];
  };
  earningsBreakdown: { _id: 'Session' | 'Campaign' | null; total: number }[];
  referredCreators: { _id: string; user: { name: string; avatarUrl?: string }; totalEarnings: number }[];
}

export interface ApiReferral {
  _id: string;
  type: 'creator' | 'brand';
  name: string;
  avatarUrl?: string;
  totalEarnings: number | null;
  joinedAt: string;
}

export const agencyApi = {
  getMyProfile: () => apiClient.get<ApiEnvelope<ApiAgency>>('/agency/me').then((r) => r.data.data),

  updateMyProfile: (payload: {
    agencyName?: string;
    ownerName?: string;
    mobile?: string;
    city?: string;
    state?: string;
    gstNumber?: string;
    teamSize?: string;
    yearsInBusiness?: number;
    specialization?: string;
    submitForApproval?: boolean;
  }) => apiClient.patch<ApiEnvelope<ApiAgency>>('/agency/me', payload).then((r) => r.data.data),

  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    return apiClient.post<ApiEnvelope<{ documentUrl: string }>>('/agency/upload-document', formData).then((r) => r.data.data);
  },

  getMyDashboard: () => apiClient.get<ApiEnvelope<AgencyDashboardData>>('/agency/me/dashboard').then((r) => r.data.data),

  getMyReferrals: () => apiClient.get<ApiEnvelope<ApiReferral[]>>('/agency/me/referrals').then((r) => r.data.data),

  linkCreator: (referralCode: string) =>
    apiClient.post<ApiEnvelope<null>>('/agency/link-creator', { referralCode }).then((r) => r.data.data),

  linkBrand: (referralCode: string) =>
    apiClient.post<ApiEnvelope<null>>('/agency/link-brand', { referralCode }).then((r) => r.data.data),
};

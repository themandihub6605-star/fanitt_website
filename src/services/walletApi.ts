import { apiClient } from './apiClient';
import type { ApiEnvelope } from '@/types/api';

export interface WalletTransaction {
  _id: string;
  type: string;
  status: string;
  amount: number;
  netAmount: number;
  createdAt: string;
}

export interface WalletData {
  balance: number;
  isPlusMember: boolean;
  isFoundingMember: boolean;
  recentTransactions: WalletTransaction[];
}

export const walletApi = {
  getMy: () => apiClient.get<ApiEnvelope<WalletData>>('/wallet/me').then((r) => r.data.data),
};
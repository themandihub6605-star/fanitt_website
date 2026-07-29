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

export interface Withdrawal {
  _id: string;
  amount: number;
  payoutMethod: 'upi' | 'bank';
  payoutDetails: string;
  status: 'pending' | 'paid' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

export const walletApi = {
  getMy: () => apiClient.get<ApiEnvelope<WalletData>>('/wallet/me').then((r) => r.data.data),

  requestWithdrawal: (payload: { amount: number; payoutMethod: 'upi' | 'bank'; payoutDetails: string }) =>
    apiClient.post<ApiEnvelope<Withdrawal>>('/wallet/withdraw', payload).then((r) => r.data.data),

  getMyWithdrawals: () => apiClient.get<ApiEnvelope<Withdrawal[]>>('/wallet/withdrawals').then((r) => r.data.data),
};
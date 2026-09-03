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
  // Gross amount earned (agency/referral cuts already applied, platform
  // fee is NOT — that's only calculated/deducted when withdrawing, see
  // previewWithdrawal/requestWithdrawal below).
  balance: number;
  isPlusMember: boolean;
  isFoundingMember: boolean;
  recentTransactions: WalletTransaction[];
}

export interface WithdrawalPreview {
  amount: number;
  platformFeePercent: number;
  platformFee: number;
  netPayoutAmount: number;
}

export interface Withdrawal {
  _id: string;
  amount: number; // requested (gross) amount
  platformFeePercent: number;
  platformFee: number;
  netPayoutAmount: number; // what actually gets sent to UPI/bank
  payoutMethod: 'upi' | 'bank';
  payoutDetails: string;
  status: 'initiated' | 'processing' | 'completed' | 'rejected';
  adminNote?: string;
  createdAt: string;
}

export const walletApi = {
  getMy: () => apiClient.get<ApiEnvelope<WalletData>>('/wallet/me').then((r) => r.data.data),

  // Live "you'll receive ₹X after fee" preview, before committing to a
  // withdrawal request — uses the same fee calculation the backend will
  // apply on submit.
  previewWithdrawal: (amount: number) =>
    apiClient.get<ApiEnvelope<WithdrawalPreview>>('/wallet/withdraw/preview', { params: { amount } }).then((r) => r.data.data),

  requestWithdrawal: (payload: { amount: number; payoutMethod: 'upi' | 'bank'; payoutDetails: string }) =>
    apiClient.post<ApiEnvelope<Withdrawal>>('/wallet/withdraw', payload).then((r) => r.data),

  getMyWithdrawals: () => apiClient.get<ApiEnvelope<Withdrawal[]>>('/wallet/withdrawals').then((r) => r.data.data),
};
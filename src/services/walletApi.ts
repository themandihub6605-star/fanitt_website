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

// Full transaction record — every type (session_payment, donation, gift,
// campaign_escrow_deposit, campaign_payout, subscription_payment,
// extra_proposal_fee, refund, agency_commission, referral_commission,
// platform_commission) and every status (pending, in_escrow, released,
// success, refunded, failed), not just the 5-item SUCCESS/RELEASED
// preview WalletData.recentTransactions shows.
export interface FullTransaction {
  _id: string;
  type: string;
  status: string;
  amount: number;
  netAmount?: number;
  platformCommission?: number;
  agencyCommission?: number;
  referralCommission?: number;
  from?: { _id: string; name: string; email: string } | null;
  to?: { _id: string; name: string; email: string } | null;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpayPayoutId?: string;
  escrowReleasedAt?: string | null;
  failureReason?: string;
  notes?: string;
  // 'credit' = money coming to this user, 'debit' = money going out —
  // computed server-side (see wallet.controller.js's getMyTransactions)
  // so the frontend never has to compare user IDs itself.
  direction: 'credit' | 'debit';
  relatedModel?: string | null;
  createdAt: string;
}

export const walletApi = {
  getMy: () => apiClient.get<ApiEnvelope<WalletData>>('/wallet/me').then((r) => r.data.data),

  getMyTransactions: (params?: { page?: number; limit?: number; type?: string; status?: string }) =>
    apiClient
      .get<ApiEnvelope<{ transactions: FullTransaction[]; total: number; page: number; pages: number }>>('/wallet/transactions', { params })
      .then((r) => r.data.data),

  // Live "you'll receive ₹X after fee" preview, before committing to a
  // withdrawal request — uses the same fee calculation the backend will
  // apply on submit.
  previewWithdrawal: (amount: number) =>
    apiClient.get<ApiEnvelope<WithdrawalPreview>>('/wallet/withdraw/preview', { params: { amount } }).then((r) => r.data.data),

  requestWithdrawal: (payload: { amount: number; payoutMethod: 'upi' | 'bank'; payoutDetails: string }) =>
    apiClient.post<ApiEnvelope<Withdrawal>>('/wallet/withdraw', payload).then((r) => r.data),

  getMyWithdrawals: () => apiClient.get<ApiEnvelope<Withdrawal[]>>('/wallet/withdrawals').then((r) => r.data.data),
};
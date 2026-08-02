export type Role = 'fan' | 'creator' | 'brand' | 'agency' | 'admin';

export type ProfileStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | null;

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  roles: Role[];
  walletBalance: number;
  isEmailVerified: boolean;
  profileStatus?: ProfileStatus;
  onboardingCompleted?: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
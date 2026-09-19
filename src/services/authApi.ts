import { apiClient } from './apiClient';
import type { AuthUser, ApiEnvelope, Role, ProfileStatus } from '@/types/api';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  isNewUser?: boolean;
  profileStatus?: ProfileStatus;
}

// BUG FIX: register/login/googleLogin's backend responses send
// `profileStatus` as a SIBLING of `user` — { user, accessToken,
// profileStatus } — not merged into the user object itself. Callers
// (Login.tsx, Signup.tsx) dispatch setCredentials({ user, accessToken })
// without ever touching profileStatus, so it silently never reached
// Redux — meaning ProtectedRoute's `user.profileStatus && ...` check was
// always comparing against `undefined` after a normal login, even though
// the account was still pending approval. Merging it here, once, means
// every caller gets a correctly-shaped `user.profileStatus` automatically
// without needing to change Login.tsx/Signup.tsx at all.
//
// getMe/upgradeRole/completeOnboarding don't need this — their backend
// responses already spread profileStatus directly onto the user object
// server-side ({ ...user.toSafeObject(), profileStatus }).
function mergeProfileStatus(data: AuthResponse): AuthResponse {
  if (data.profileStatus === undefined) return data;
  return { ...data, user: { ...data.user, profileStatus: data.profileStatus } };
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string; role: Role; phone?: string; referralCode?: string }) =>
    apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', payload).then((r) => mergeProfileStatus(r.data.data)),

  login: (payload: { email: string; password: string }) =>
    apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', payload).then((r) => mergeProfileStatus(r.data.data)),

  googleLogin: (idToken: string, role?: Role, referralCode?: string) =>
    apiClient.post<ApiEnvelope<AuthResponse>>('/auth/google', { idToken, role, referralCode }).then((r) => mergeProfileStatus(r.data.data)),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get<ApiEnvelope<AuthUser>>('/auth/me').then((r) => r.data.data),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (payload: { token: string; newPassword: string }) => apiClient.post('/auth/reset-password', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.patch('/auth/change-password', payload),

  upgradeRole: (payload: { role: Role; name?: string }) =>
    apiClient.post<ApiEnvelope<AuthUser>>('/auth/upgrade-role', payload).then((r) => r.data.data),

  completeOnboarding: () =>
    apiClient.post<ApiEnvelope<AuthUser>>('/auth/complete-onboarding').then((r) => r.data.data),
};
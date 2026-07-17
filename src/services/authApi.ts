import { apiClient } from './apiClient';
import type { AuthUser, ApiEnvelope, Role } from '@/types/api';

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  register: (payload: { name: string; email: string; password: string; role: Role; phone?: string }) =>
    apiClient.post<ApiEnvelope<AuthResponse>>('/auth/register', payload).then((r) => r.data.data),

  login: (payload: { email: string; password: string }) =>
    apiClient.post<ApiEnvelope<AuthResponse>>('/auth/login', payload).then((r) => r.data.data),

  logout: () => apiClient.post('/auth/logout'),

  getMe: () => apiClient.get<ApiEnvelope<AuthUser>>('/auth/me').then((r) => r.data.data),

  forgotPassword: (email: string) => apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (payload: { token: string; newPassword: string }) => apiClient.post('/auth/reset-password', payload),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    apiClient.patch('/auth/change-password', payload),

  upgradeRole: (payload: { role: Role; name?: string }) =>
    apiClient.post<ApiEnvelope<AuthUser>>('/auth/upgrade-role', payload).then((r) => r.data.data),
};

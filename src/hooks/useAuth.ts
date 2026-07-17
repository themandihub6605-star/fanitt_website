import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, logout as logoutAction } from '@/store/slices/authSlice';
import { authApi } from '@/services/authApi';
import { auth, googleProvider, firebaseEnabled } from '@/config/firebase';
import type { Role } from '@/types/api';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, hasHydrated } = useAppSelector((s) => s.auth);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authApi.login({ email, password });
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      return data.user;
    },
    [dispatch]
  );

  const register = useCallback(
    async (payload: { name: string; email: string; password: string; role: Role; phone?: string }) => {
      const data = await authApi.register(payload);
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      return data.user;
    },
    [dispatch]
  );

  /** Google sign-in — works for both new and returning users. `role` only
   * matters for brand-new accounts (picked from the Fan/Creator/Brand/Agency
   * tabs on Signup); returning users keep whatever role they already have.
   * The returned user also carries `isNewUser` so callers can decide whether
   * to continue a signup wizard (new) or just navigate home (returning). */
  const loginWithGoogle = useCallback(
    async (role?: Role) => {
      if (!firebaseEnabled || !auth) {
        throw new Error('Google sign-in isn\'t configured yet — add your Firebase keys to fanitt-web/.env');
      }
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const data = await authApi.googleLogin(idToken, role);
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
      return { ...data.user, isNewUser: Boolean(data.isNewUser) };
    },
    [dispatch]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      dispatch(logoutAction());
      navigate('/');
    }
  }, [dispatch, navigate]);

  return { user, accessToken, isAuthenticated, hasHydrated, login, register, loginWithGoogle, logout };
}

import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { Role } from '@/types/api';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

export function ProtectedRoute({ allowedRoles, children }: PropsWithChildren<ProtectedRouteProps>) {
  const { isAuthenticated, user, hasHydrated } = useAppSelector((s) => s.auth);
  const location = useLocation();

  // wait for the initial auth check (localStorage + /auth/me) before deciding
  if (!hasHydrated) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

import type { PropsWithChildren } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import type { Role } from '@/types/api';

interface ProtectedRouteProps {
  allowedRoles?: Role[];
}

const APPROVAL_GATED_ROLES: Role[] = ['creator', 'brand', 'agency'];

export function ProtectedRoute({ allowedRoles, children }: PropsWithChildren<ProtectedRouteProps>) {
  const { isAuthenticated, user, hasHydrated } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!hasHydrated) return null;

  if (!isAuthenticated || !user) {
    return <Navigate to="/get-started" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  if (
    APPROVAL_GATED_ROLES.includes(user.role) &&
    location.pathname !== '/pending-approval' &&
    user.profileStatus &&
    user.profileStatus !== 'verified'
  ) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
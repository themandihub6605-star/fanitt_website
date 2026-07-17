import { useEffect, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, setHydrated } from '@/store/slices/authSlice';
import { authApi } from '@/services/authApi';
import Home from '@/pages/Home';
import CategoryPage from '@/pages/CategoryPage';
import CreatorProfilePage from '@/pages/CreatorProfilePage';
import BrandProfilePage from '@/pages/BrandProfilePage';
import ExploreCreators from '@/pages/ExploreCreators';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import CampaignApplications from '@/pages/CampaignApplications';
import MyProposals from '@/pages/MyProposals';
import LiveSessions from '@/pages/LiveSessions';
import PostCampaign from '@/pages/PostCampaign';
import MyBookings from '@/pages/MyBookings';
import LiveSessionRoom from '@/pages/LiveSessionRoom';
import CreatorDashboard from '@/pages/dashboard/CreatorDashboard';
import EditCreatorProfile from '@/pages/EditCreatorProfile';
import EditBrandProfile from '@/pages/EditBrandProfile';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import FanProfilePage from '@/pages/FanProfilePage';
import BrandDashboard from '@/pages/dashboard/BrandDashboard';
import NotFound from '@/pages/NotFound';
import MyWallet from '@/pages/MyWallet';
import Messages from '@/pages/Messages';
import Communities from '@/pages/Communities';
import Feed from '@/pages/Feed';
function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function useAuthHydration() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      if (accessToken) {
        try {
          const user = await authApi.getMe();
          if (!cancelled) dispatch(setCredentials({ user, accessToken }));
        } catch {
          // token invalid/expired and refresh failed — apiClient's interceptor
          // already logs the user out in that case
        }
      }
      if (!cancelled) dispatch(setHydrated());
    }

    hydrate();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

const LAYOUT_ROUTES: { path: string; element: ReactNode }[] = [
  { path: '/feed', element: <Feed /> },
  { path: '/', element: <Home /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/creator/:slug', element: <CreatorProfilePage /> },
  { path: '/brand/:slug', element: <BrandProfilePage /> },
  { path: '/explore', element: <ExploreCreators /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/campaigns', element: <Campaigns /> },
  {
    path: '/campaigns/new',
    element: (
      <ProtectedRoute allowedRoles={['brand']}>
        <PostCampaign />
      </ProtectedRoute>
    ),
  },
  { path: '/campaigns/:id', element: <CampaignDetail /> },
  {
    path: '/campaigns/:id/applications',
    element: (
      <ProtectedRoute allowedRoles={['brand']}>
        <CampaignApplications />
      </ProtectedRoute>
    ),
  },
  {
    path: '/proposals',
    element: (
      <ProtectedRoute allowedRoles={['creator']}>
        <MyProposals />
      </ProtectedRoute>
    ),
  },
  { path: '/sessions', element: <LiveSessions /> },
  { path: '/communities', element: <Communities /> },
  {
    path: '/wallet',
    element: (
      <ProtectedRoute>
        <MyWallet />
      </ProtectedRoute>
    ),
  },
  {
    path: '/messages',
    element: (
      <ProtectedRoute>
        <Messages />
      </ProtectedRoute>
    ),
  },
  {
    path: '/bookings',
    element: (
      <ProtectedRoute>
        <MyBookings />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <FanProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/settings',
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/creator',
    element: (
      <ProtectedRoute allowedRoles={['creator']}>
        <CreatorDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/creator/edit',
    element: (
      <ProtectedRoute allowedRoles={['creator']}>
        <EditCreatorProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/brand',
    element: (
      <ProtectedRoute allowedRoles={['brand']}>
        <BrandDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/brand/edit',
    element: (
      <ProtectedRoute allowedRoles={['brand']}>
        <EditBrandProfile />
      </ProtectedRoute>
    ),
  },
];

export default function App() {
  const location = useLocation();
  useAuthHydration();

  if (location.pathname.startsWith('/sessions/') && location.pathname.endsWith('/live')) {
    return (
      <Routes location={location}>
        <Route
          path="/sessions/:id/live"
          element={
            <ProtectedRoute>
              <LiveSessionRoom />
            </ProtectedRoute>
          }
        />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {LAYOUT_ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={<PageTransition>{r.element}</PageTransition>} />
          ))}
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </MainLayout>
  );
}
import { useEffect, useState, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute, APPROVAL_GATED_ROLES } from '@/components/ProtectedRoute';
import { SuspensionModal } from '@/components/SuspensionModal';
// FIX: fixes the bug where navigating to a new page kept the previous
// page's scroll position (e.g. scrolling to the bottom of the feed, then
// opening another page already scrolled down instead of at the top).
import { ScrollToTop } from '@/components/ScrollToTop';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setCredentials, setHydrated } from '@/store/slices/authSlice';
import { authApi } from '@/services/authApi';
import Home from '@/pages/Home';
import CategoryPage from '@/pages/CategoryPage';
import CreatorProfilePage from '@/pages/CreatorProfilePage';
import BrandProfilePage from '@/pages/BrandProfilePage';
import ExploreCreators from '@/pages/ExploreCreators';
import ExploreBrands from '@/pages/ExploreBrands';
import Login from '@/pages/Login';
import Welcome from '@/pages/Welcome';
import Signup from '@/pages/Signup';
import PendingApproval from '@/pages/PendingApproval';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import CampaignApplications from '@/pages/CampaignApplications';
import MyProposals from '@/pages/MyProposals';
import LiveSessions from '@/pages/LiveSessions';
import PostCampaign from '@/pages/PostCampaign';
import MyBookings from '@/pages/MyBookings';
import LiveSessionRoom from '@/pages/LiveSessionRoom';
import CreatorDashboard from '@/pages/dashboard/CreatorDashboard';
import CreatorAnalytics from '@/pages/CreatorAnalytics';
import EditCreatorProfile from '@/pages/EditCreatorProfile';
import EditBrandProfile from '@/pages/EditBrandProfile';
import AgencyDashboard from '@/pages/dashboard/AgencyDashboard';
import EditAgencyProfile from '@/pages/EditAgencyProfile';
import AdminAgencyApprovals from '@/pages/admin/AdminAgencyApprovals';
import AdminReferralConfig from '@/pages/admin/AdminReferralConfig';
import NotificationsPage from '@/pages/NotificationsPage';
import SettingsPage from '@/pages/SettingsPage';
import FanProfilePage from '@/pages/FanProfilePage';
import BrandDashboard from '@/pages/dashboard/BrandDashboard';
import NotFound from '@/pages/NotFound';
import MyWallet from '@/pages/MyWallet';
import Messages from '@/pages/Messages';
import Communities from '@/pages/Communities';
import Feed from '@/pages/Feed';
import ContactUs from '@/pages/ContactUs';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import FAQ from '@/pages/FAQ';
import Pricing from '@/pages/Pricing';

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

  // Being suspended mid-session was previously only caught the next time
  // the person happened to click something that hit the API — sit still
  // on an already-loaded page and you'd never find out. This polls a
  // lightweight endpoint periodically so it surfaces within ~30s even if
  // they don't touch anything; auth.middleware.js already throws the same
  // ACCOUNT_SUSPENDED error on any authenticated call, so apiClient.ts's
  // interceptor picks it up exactly the same way it does for any other
  // request — this just guarantees a request happens regularly.
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(() => {
      authApi.getMe().catch(() => {
        // a real failure here (suspension, expired session) is already
        // handled by apiClient.ts's interceptor — nothing to do here
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [accessToken]);
}

const LAYOUT_ROUTES: { path: string; element: ReactNode }[] = [
  { path: '/feed', element: <Feed /> },
  { path: '/', element: <Home /> },
  { path: '/category/:slug', element: <CategoryPage /> },
  { path: '/creator/:slug', element: <CreatorProfilePage /> },
  { path: '/brand/:slug', element: <BrandProfilePage /> },
  { path: '/explore', element: <ExploreCreators /> },
  { path: '/brands', element: <ExploreBrands /> },
  { path: '/get-started', element: <Welcome /> },
  { path: '/login', element: <Login /> },
  { path: '/signup', element: <Signup /> },
  { path: '/contact', element: <ContactUs /> },
  { path: '/privacy-policy', element: <PrivacyPolicy /> },
  { path: '/faq', element: <FAQ /> },
  { path: '/pricing', element: <Pricing /> },
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
    path: '/dashboard/creator/analytics',
    element: (
      <ProtectedRoute allowedRoles={['creator']}>
        <CreatorAnalytics />
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
  {
    path: '/dashboard/agency',
    element: (
      <ProtectedRoute allowedRoles={['agency']}>
        <AgencyDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard/agency/edit',
    element: (
      <ProtectedRoute allowedRoles={['agency']}>
        <EditAgencyProfile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/agencies',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminAgencyApprovals />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/referral-config',
    element: (
      <ProtectedRoute allowedRoles={['admin']}>
        <AdminReferralConfig />
      </ProtectedRoute>
    ),
  },
];

function AppRoutes() {
  const location = useLocation();
  useAuthHydration();
  const { isAuthenticated, user, hasHydrated } = useAppSelector((s) => s.auth);

  // FIX: `ScrollToTop` needs to run no matter which of the branches below
  // ends up rendering (live session room, pending-approval gate, or the
  // normal layout routes) — otherwise switching pages inside just one of
  // those branches would still keep the old scroll position. Building the
  // routed content into a variable first, then always rendering
  // `<ScrollToTop />` alongside it at the bottom, guarantees it fires on
  // every navigation regardless of which branch is active.
  let routedContent: ReactNode;

  if (location.pathname.startsWith('/sessions/') && location.pathname.endsWith('/live')) {
    routedContent = (
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
  } else {
    // Global approval gate: applies to EVERY route, not just ones wrapped in
    // <ProtectedRoute> — previously an unapproved creator/brand/agency user
    // could open the public homepage (or any other public page) directly and
    // browse freely, since those routes never checked profileStatus at all.
    // This intercepts before the normal route match happens.
    const isUnapprovedGatedUser =
      hasHydrated &&
      isAuthenticated &&
      !!user &&
      APPROVAL_GATED_ROLES.includes(user.role) &&
      !!user.profileStatus &&
      user.profileStatus !== 'verified';

    // Paths an unapproved user must still be able to reach — the resubmit
    // flow depends on getting to their own edit page, and logging out/into
    // a different account shouldn't be blocked either.
    const GATE_EXEMPT_PATHS = ['/get-started', '/login', '/signup', '/dashboard/creator/edit', '/dashboard/brand/edit', '/dashboard/agency/edit'];

    if ((location.pathname === '/pending-approval' || isUnapprovedGatedUser) && !GATE_EXEMPT_PATHS.includes(location.pathname)) {
      routedContent = (
        <Routes location={location}>
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <PendingApproval />
              </ProtectedRoute>
            }
          />
        </Routes>
      );
    } else {
      routedContent = (
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
  }

  return (
    <>
      <ScrollToTop />
      {routedContent}
    </>
  );
}

export default function App() {
  const [suspensionMessage, setSuspensionMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      setSuspensionMessage((e as CustomEvent<string>).detail || '');
    };
    window.addEventListener('fanitt:suspended', handler);
    return () => window.removeEventListener('fanitt:suspended', handler);
  }, []);

  return (
    <>
      <AppRoutes />
      <SuspensionModal
        message={suspensionMessage}
        onLogout={() => {
          setSuspensionMessage(null);
          window.location.href = '/';
        }}
      />
    </>
  );
}
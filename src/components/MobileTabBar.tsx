import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Home, Compass, PlusCircle, MessageSquare, User, Users2, Building2, Radio } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { CreatePostModal } from '@/components/CreatePostModal';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';

/**
 * Fixed bottom tab bar shown on mobile only — matches the reference app's
 * Home / Explore / Create / Inbox / Profile bottom navigation pattern.
 * Routes to real, existing pages only (no new functionality).
 */
export function MobileTabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [exploreMenuOpen, setExploreMenuOpen] = useState(false);

  const isCreator = isAuthenticated && user?.role === 'creator';

  const profileHref = !isAuthenticated
    ? '/login'
    : user?.role === 'creator'
    ? '/dashboard/creator'
    : user?.role === 'brand'
    ? '/dashboard/brand'
    : user?.role === 'agency'
    ? '/dashboard/agency'
    : '/profile';

  // Creators & brands: tapping Profile goes straight to their own public
  // profile page (Dashboard/My Profile/Bookings/Proposals/Logout stay one
  // tap away in the top hamburger menu). Fans/unauthenticated keep the plain link.
  const handleProfileClick = async () => {
    if (profileLoading) return;
    setProfileLoading(true);
    try {
      if (user?.role === 'creator') {
        const data = await creatorApi.getMyProfile();
        navigate(`/creator/${data.slug}`, { state: { ownProfile: true } });
      } else if (user?.role === 'brand') {
        const data = await brandApi.getMyProfile();
        navigate(`/brand/${data.slug}`, { state: { ownProfile: true } });
      }
    } catch {
      navigate(profileHref);
    } finally {
      setProfileLoading(false);
    }
  };

  // Creators upload a post directly from here (modal, no navigation).
  // Brands post a campaign instead; everyone else/unauthenticated goes to sign up.
const createHref = !isAuthenticated ? '/get-started' : user?.role === 'brand' ? '/campaigns/new' : '/dashboard/creator';

  // Tapping "Profile" (below) sends creators/brands to their own public
  // profile URL, which normally looks identical to any other creator/brand
  // page reached via Explore — this flag (carried in navigation state) is
  // how the tabs tell those two cases apart.
  const isOwnProfilePage = Boolean((location.state as { ownProfile?: boolean } | null)?.ownProfile);

  const TABS = [
    {
      href: '/',
      label: 'Home',
      icon: Home,
      match: (p: string) => p === '/' || p === '/dashboard/creator' || p === '/dashboard/brand' || p === '/dashboard/agency',
    },
    {
      href: '/explore',
      label: 'Explore',
      icon: Compass,
      match: (p: string) => !isOwnProfilePage && (p.startsWith('/explore') || p.startsWith('/creator') || p.startsWith('/brand/') || p.startsWith('/feed')),
      isExplore: true,
    },
    { href: createHref, label: 'Create', icon: PlusCircle, match: () => false, isCreate: true },
    { href: '/messages', label: 'Inbox', icon: MessageSquare, match: (p: string) => p.startsWith('/messages') },
    {
      href: profileHref,
      label: 'Profile',
      icon: User,
      match: (p: string) =>
        p === '/profile' ||
        p.startsWith('/settings') ||
        p === '/dashboard/creator/edit' ||
        p === '/dashboard/brand/edit' ||
        p === '/dashboard/agency/edit' ||
        isOwnProfilePage,
      isProfile: true,
    },
  ];

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-white/10 bg-[#0A0A0A]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 backdrop-blur-xl lg:hidden">
        {TABS.map((tab) => {
          const active = tab.match(location.pathname);
          if (tab.isCreate) {
            const createButton = (
              <span className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-glow bg-orange-500">
                <PlusCircle size={24} strokeWidth={2} />
              </span>
            );
            // Creators get the upload-post modal directly instead of being routed away.
            if (isCreator) {
              return (
                <button
                  key={tab.label}
                  type="button"
                  aria-label="Create post"
                  onClick={() => setCreatePostOpen(true)}
                  className="-mt-5 flex flex-col items-center gap-1"
                >
                  {createButton}
                </button>
              );
            }
            return (
              <Link key={tab.label} to={tab.href} aria-label="Create" className="-mt-5 flex flex-col items-center gap-1">
                {createButton}
              </Link>
            );
          }
          if (tab.isExplore) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setExploreMenuOpen(true)}
                className={cn('flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium', active ? 'text-orange-400' : 'text-white/50')}
              >
                <tab.icon size={20} strokeWidth={active ? 2.4 : 2} />
                {tab.label}
              </button>
            );
          }
          if (tab.isProfile && (user?.role === 'creator' || user?.role === 'brand')) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={handleProfileClick}
                disabled={profileLoading}
                className={cn('flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium', active ? 'text-orange-400' : 'text-white/50')}
              >
                <span className="relative inline-flex">
                  <tab.icon size={20} strokeWidth={active ? 2.4 : 2} />
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A] bg-emerald-400" />
                </span>
                {tab.label}
              </button>
            );
          }
          return (
            <Link
              key={tab.label}
              to={tab.href}
              className={cn('flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium', active ? 'text-orange-400' : 'text-white/50')}
            >
              <span className="relative inline-flex">
                <tab.icon size={20} strokeWidth={active ? 2.4 : 2} />
                {tab.isProfile && isAuthenticated && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0A0A0A] bg-emerald-400" />}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <AnimatePresence>
        {exploreMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExploreMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#161616] shadow-lifted lg:hidden"
            >
              <Link
                to="/feed"
                onClick={() => setExploreMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300"><Radio size={16} /></span>
                Feed
              </Link>
              <Link
                to="/explore"
                onClick={() => setExploreMenuOpen(false)}
                className="flex items-center gap-3 border-t border-white/10 px-4 py-3.5 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 text-pink-300"><Users2 size={16} /></span>
                Discover Creators
              </Link>
              <Link
                to="/brands"
                onClick={() => setExploreMenuOpen(false)}
                className="flex items-center gap-3 border-t border-white/10 px-4 py-3.5 text-sm font-semibold text-white/90 hover:bg-white/5"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"><Building2 size={16} /></span>
                Discover Brands
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isCreator && (
        <CreatePostModal
          open={createPostOpen}
          onClose={() => setCreatePostOpen(false)}
          onCreated={() => navigate('/feed')}
        />
      )}
    </>
  );
}
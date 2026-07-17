import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, PlusCircle, MessageSquare, User } from 'lucide-react';
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

  const isCreator = isAuthenticated && user?.role === 'creator';

  const profileHref = !isAuthenticated
    ? '/login'
    : user?.role === 'creator'
    ? '/dashboard/creator'
    : user?.role === 'brand'
    ? '/dashboard/brand'
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
        navigate(`/creator/${data.slug}`);
      } else if (user?.role === 'brand') {
        const data = await brandApi.getMyProfile();
        navigate(`/brand/${data.slug}`);
      }
    } catch {
      navigate(profileHref);
    } finally {
      setProfileLoading(false);
    }
  };

  // Creators upload a post directly from here (modal, no navigation).
  // Brands post a campaign instead; everyone else/unauthenticated goes to sign up.
  const createHref = !isAuthenticated ? '/signup' : user?.role === 'brand' ? '/campaigns/new' : '/dashboard/creator';

  const TABS = [
    { href: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
    { href: '/explore', label: 'Explore', icon: Compass, match: (p: string) => p.startsWith('/explore') || p.startsWith('/creator') },
    { href: createHref, label: 'Create', icon: PlusCircle, match: () => false, isCreate: true },
    { href: '/messages', label: 'Inbox', icon: MessageSquare, match: (p: string) => p.startsWith('/messages') },
    {
      href: profileHref,
      label: 'Profile',
      icon: User,
      match: (p: string) => p.startsWith('/dashboard') || p.startsWith('/profile') || p.startsWith('/settings'),
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
              <span className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-glow bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]">
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
          if (tab.isProfile && (user?.role === 'creator' || user?.role === 'brand')) {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={handleProfileClick}
                disabled={profileLoading}
                className={cn('flex flex-col items-center gap-1 px-3 py-2 text-[11px] font-medium', active ? 'text-orange-400' : 'text-white/50')}
              >
                <tab.icon size={20} strokeWidth={active ? 2.4 : 2} />
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
              <tab.icon size={20} strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

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
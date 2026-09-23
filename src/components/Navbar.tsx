import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu,
  X,
  Search,
  Loader2,
  LayoutDashboard,
  UserCircle,
  FileText,
  Phone,
  LogOut,
  Home,
  Compass,
  Users2,
  Megaphone,
  Tag,
  ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { NotificationBellLink } from './NotificationBellLink';
import { UserMenu } from './UserMenu';
import { NAV_LINKS } from '@/constants/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileNav, closeMobileNav } from '@/store/slices/uiSlice';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

function NavItem({
  href,
  label,
  className,
  onClick,
  underline,
}: {
  href: string;
  label: string;
  className?: string;
  onClick?: () => void;
  underline?: boolean;
}) {
  const content = underline ? (
    <>
      {label}
      <span className="pointer-events-none absolute inset-x-0 -bottom-1.5 h-[2px] origin-center scale-x-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
    </>
  ) : (
    label
  );

  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {content}
      </a>
    );
  }
  return (
    <Link to={href} onClick={onClick} className={className}>
      {content}
    </Link>
  );
}

// Icon per top-level nav link, for the mobile menu only — the desktop bar
// is plain-text underlined links, but a hamburger menu full of bare text
// rows next to an icon-led account section below it looked inconsistent.
const NAV_ICONS: Record<string, typeof Home> = {
  '/feed': Home,
  '/explore': Compass,
  '/sessions': Compass,
  '/communities': Users2,
  '/campaigns': Megaphone,
  '/pricing': Tag,
};

const ROLE_LABELS: Record<string, string> = {
  creator: 'Creator',
  brand: 'Brand',
  agency: 'Agency',
  fan: 'Fan',
  admin: 'Admin',
};

// One row in the mobile menu's account section — icon in a small colored
// tile, label, chevron. Shared so every row (Dashboard/My Profile/My
// Proposals/Contact/Privacy) looks identical — one consistent orange
// accent throughout, not a different color per row.
function MobileMenuRow({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof Home;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link to={to} onClick={onClick}>
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="group flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors duration-150 hover:bg-white/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-300 ring-1 ring-inset ring-orange-500/20 transition-transform duration-200 ease-out group-hover:scale-110">
          <Icon size={16} />
        </span>
        <span className="flex-1 text-sm font-semibold text-white/85">{label}</span>
        <ChevronRight size={15} className="shrink-0 text-white/20 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-white/40" />
      </motion.div>
    </Link>
  );
}

/** Small avatar button (mobile header) that jumps straight to the signed-in
 * user's own public profile page — Dashboard/My Profile/Bookings/Proposals/
 * Logout remain one tap away in the hamburger menu below. */
function MobileProfileAvatar() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (user.role === 'creator') {
        const data = await creatorApi.getMyProfile();
        navigate(`/creator/${data.slug}`);
      } else if (user.role === 'brand') {
        const data = await brandApi.getMyProfile();
        navigate(`/brand/${data.slug}`);
      } else {
        navigate('/profile');
      }
    } catch {
      navigate('/profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} aria-label="My profile" className="rounded-full p-0.5 hover:bg-white/10" disabled={loading}>
      {loading ? (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
          <Loader2 size={14} className="animate-spin text-white/70" />
        </span>
      ) : user.avatarUrl ? (
        <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
          {user.name.charAt(0).toUpperCase()}
        </span>
      )}
    </button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const dispatch = useAppDispatch();
  const open = useAppSelector((s) => s.ui.mobileNavOpen);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const user = useAppSelector((s) => s.auth.user);
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // "Campaigns" is a creator-only nav item (they browse & apply to brand
  // requirements) — brands post campaigns from their dashboard instead, and
  // fans/agencies have no use for it here. Every other NAV_LINKS entry stays
  // visible to all authenticated roles.
  const visibleNavLinks = NAV_LINKS.filter((link) => link.href !== '/campaigns' || user?.role === 'creator');

  // Live Sessions hidden from the mobile menu specifically (still shows on
  // the desktop bar) — the live marketplace isn't launched yet, so it isn't
  // worth a slot in the compact mobile list right now.
  const mobileNavLinks = visibleNavLinks.filter((link) => link.href !== '/sessions');

  // Point-Fix: clicking the "Fanitt" logo used to always go to "/" (the
  // marketing homepage) even for a logged-in user — jarring when you're
  // mid-session and just want back to your feed. Logged-in now goes to
  // /feed instead; logged-out visitors still land on the homepage, same
  // as before.
  const logoDestination = isAuthenticated ? '/feed' : '/';

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed inset-x-0 top-0 z-40 transition-all duration-300',
        'bg-[#141414]/90 backdrop-blur-xl border-b border-white/10',
        scrolled && 'shadow-soft'
      )}
    >
    <div className="mx-auto flex h-20 max-w-[1240px] items-center justify-between px-gutter">
  <Link to={logoDestination} aria-label="Fanitt home">
    <Logo className="h-8 w-auto sm:h-9" />
  </Link>

        {isAuthenticated && (
          <nav className="hidden items-center gap-7 lg:flex">
            {visibleNavLinks.map((link) => (
              <NavItem
                key={link.href}
                href={link.href}
                label={link.label}
                underline
                className="group relative text-sm font-semibold text-white/80 transition-colors hover:text-orange-400"
              />
            ))}
          </nav>
        )}

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <NotificationBellLink />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-orange-400">
                Log In
              </Link>
              <Link to="/get-started">
                <Button size="sm" className="!bg-orange-500 hover:!bg-orange-400 !bg-none">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 lg:hidden">
          <Link to="/explore" aria-label="Search" className="rounded-lg p-2 text-white/80 hover:text-white">
            <Search size={20} />
          </Link>
          {!isAuthenticated && (
            <Link to="/feed">
              <Button size="sm" className="!px-3 !py-1.5 !text-xs !bg-orange-500 hover:!bg-orange-400 !bg-none">Feed</Button>
            </Link>
          )}
          {isAuthenticated && <NotificationBellLink />}
          {isAuthenticated && <MobileProfileAvatar />}
          <button
            className="rounded-lg p-2 text-white"
            onClick={() => dispatch(toggleMobileNav())}
            aria-label="Toggle navigation menu"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#181818] to-[#0e0e0e] shadow-[0_24px_48px_-15px_rgba(0,0,0,0.65)] lg:hidden"
          >
            {/* Thin gradient accent under the header border, matching the
                brand-gradient touches used elsewhere (CTA cards, Pricing) —
                a small detail that keeps this panel from feeling flat. */}
            <div className="h-[2px] w-full bg-gradient-to-r from-orange-500 via-pink-500 to-yellow-400 opacity-60" />
            <div className="max-h-[75vh] overflow-y-auto px-gutter py-5">
              {isAuthenticated && (
                <nav className="space-y-0.5">
                  {mobileNavLinks.map((link, i) => {
                    const Icon = NAV_ICONS[link.href] || Home;
                    const active = location.pathname === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.03 }}
                      >
                        <Link to={link.href} onClick={() => dispatch(closeMobileNav())}>
                          <motion.div
                            whileTap={{ scale: 0.97 }}
                            className={cn(
                              'flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-colors duration-150',
                              active ? 'bg-orange-500/12 text-orange-300' : 'text-white/85 hover:bg-white/[0.06]'
                            )}
                          >
                            <Icon size={17} className={cn('shrink-0', active ? 'text-orange-300' : 'text-orange-400')} />
                            {link.label}
                            {active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />}
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </nav>
              )}

              {isAuthenticated && user ? (
                <div className="mt-3 border-t border-white/10 pt-4">
                  {/* Account card */}
                  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3.5">
                    <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-orange-500/10 blur-2xl" />
                    <div className="relative flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-orange-500/30" />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-base font-bold text-orange-300 ring-2 ring-orange-500/30">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{user.name}</p>
                        <p className="truncate text-xs text-white/45">{user.email}</p>
                      </div>
                      {ROLE_LABELS[user.role] && (
                        <span className="shrink-0 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-orange-300 ring-1 ring-inset ring-orange-500/20">
                          {ROLE_LABELS[user.role]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-0.5">
                    {(user.role === 'creator' || user.role === 'brand' || user.role === 'agency') && (
                      <MobileMenuRow
                        to={user.role === 'creator' ? '/dashboard/creator' : user.role === 'brand' ? '/dashboard/brand' : '/dashboard/agency'}
                        icon={LayoutDashboard}
                        label="Dashboard"
                        onClick={() => dispatch(closeMobileNav())}
                      />
                    )}
                    <MobileMenuRow
                      to={
                        user.role === 'creator'
                          ? '/dashboard/creator/edit'
                          : user.role === 'brand'
                          ? '/dashboard/brand/edit'
                          : user.role === 'agency'
                          ? '/dashboard/agency/edit'
                          : '/profile'
                      }
                      icon={UserCircle}
                      label="My Profile"
                      onClick={() => dispatch(closeMobileNav())}
                    />
                    {user.role === 'creator' && (
                      <MobileMenuRow to="/proposals" icon={FileText} label="My Proposals" onClick={() => dispatch(closeMobileNav())} />
                    )}
                  </div>

                  {/* Help & Legal — desktop has these in the Footer, which
                   * doesn't show on mobile, so they live here too. */}
                  <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3">
                    <MobileMenuRow to="/contact" icon={Phone} label="Contact Us" onClick={() => dispatch(closeMobileNav())} />
                    <MobileMenuRow to="/privacy-policy" icon={FileText} label="Privacy Policy" onClick={() => dispatch(closeMobileNav())} />
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => {
                      dispatch(closeMobileNav());
                      logout();
                    }}
                    className="mt-3 flex w-full items-center gap-3 rounded-xl border-t border-white/10 px-2.5 pt-4 pb-2.5 text-left text-sm font-semibold text-orange-300 transition-colors duration-150 hover:bg-orange-500/10"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/10 ring-1 ring-inset ring-orange-500/20">
                      <LogOut size={16} />
                    </span>
                    Log out
                  </motion.button>
                </div>
              ) : (
                <>
                  <div className="mt-3 space-y-2 border-t border-white/10 pt-4">
                    <Link to="/login" onClick={() => dispatch(closeMobileNav())} className="block rounded-xl px-2.5 py-2.5 text-sm font-semibold text-white/85 hover:bg-white/[0.06]">
                      Log In
                    </Link>
                    <Link to="/get-started" onClick={() => dispatch(closeMobileNav())}>
                      <Button size="sm" className="w-full justify-center">
                        Get Started
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-3 space-y-0.5 border-t border-white/10 pt-3">
                    <MobileMenuRow to="/contact" icon={Phone} label="Contact Us" onClick={() => dispatch(closeMobileNav())} />
                    <MobileMenuRow to="/privacy-policy" icon={FileText} label="Privacy Policy" onClick={() => dispatch(closeMobileNav())} />
                  </div>
                </>
              )}
            </div>
            {/* Bottom fade — hints there's more to scroll without needing a
                visible scrollbar. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0e0e0e] to-transparent" />
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
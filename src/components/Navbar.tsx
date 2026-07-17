import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Search, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserMenu } from './UserMenu';
import { NAV_LINKS } from '@/constants/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileNav, closeMobileNav } from '@/store/slices/uiSlice';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';
import { cn } from '@/utils/cn';

function NavItem({ href, label, className, onClick }: { href: string; label: string; className?: string; onClick?: () => void }) {
  if (href.startsWith('#')) {
    return (
      <a href={href} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link to={href} onClick={onClick} className={className}>
      {label}
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
  <Link to="/" aria-label="Fanitt home">
    <Logo className="h-20 w-auto sm:h-24" />
  </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              className="group relative text-sm font-semibold text-white/80 transition-colors hover:text-orange-400"
            />
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {isAuthenticated ? (
            <>
              <NotificationsDropdown />
              <UserMenu />
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-white/80 hover:text-orange-400">
                Log In
              </Link>
              <Link to="/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <Link to="/explore" aria-label="Search" className="rounded-lg p-2 text-white/80 hover:text-white">
            <Search size={20} />
          </Link>
          {isAuthenticated && <NotificationsDropdown />}
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
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-white/10 bg-[#141414] lg:hidden"
          >
            <div className="flex flex-col gap-1 px-gutter py-4">
              {NAV_LINKS.map((link) => (
                <NavItem
                  key={link.href}
                  href={link.href}
                  label={link.label}
                  onClick={() => dispatch(closeMobileNav())}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10"
                />
              ))}
              {isAuthenticated ? (
                <div className="mt-2 border-t border-white/10 pt-2">
                  <UserMenu />
                </div>
              ) : (
                <>
                  <Link to="/login" onClick={() => dispatch(closeMobileNav())} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/10">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={() => dispatch(closeMobileNav())}>
                    <Button size="sm" className="mt-2 w-full justify-center">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
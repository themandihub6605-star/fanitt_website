import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { NotificationsDropdown } from './NotificationsDropdown';
import { UserMenu } from './UserMenu';
import { NAV_LINKS } from '@/constants/content';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { toggleMobileNav, closeMobileNav } from '@/store/slices/uiSlice';
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
        'bg-[#0d1120]/90 backdrop-blur-xl border-b border-white/10',
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

        <div className="flex items-center gap-2 lg:hidden">
          {isAuthenticated && <NotificationsDropdown />}
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
            className="overflow-hidden border-t border-white/10 bg-[#0d1120] lg:hidden"
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

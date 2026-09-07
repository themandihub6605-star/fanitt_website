import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';
import { MobileTabBar } from '@/components/MobileTabBar';
import { DashboardShell } from '@/layouts/DashboardShell';
import { useAppSelector } from '@/store/hooks';

export function MainLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const { hasHydrated } = useAppSelector((s) => s.auth);
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isChromeFree = location.pathname === '/get-started' || location.pathname === '/signup';

  // Navbar shows for everyone — logged in or not — once we're past the
  // initial auth-check flash. The Navbar component itself already switches
  // its own contents (Log In/Get Started vs avatar/menu) based on auth state.
  const showNavbar = hasHydrated;

  if (isDashboard) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  if (isChromeFree) {
    return <>{children}</>;
  }

  return (
    <>
      <div id="top" className="relative min-h-screen overflow-x-hidden pb-16 lg:pb-0">
        <ScrollProgress />
        {showNavbar && <Navbar />}
        <main>{children}</main>
        <div className="hidden lg:block">
          <Footer />
        </div>
      </div>
      {/* MobileTabBar (position: fixed) lives OUTSIDE the overflow-x-hidden
          wrapper above, not inside it. iOS Safari has a long-standing
          WebKit bug where any `overflow: hidden` on an ANCESTOR of a
          `position: fixed` element breaks that fixed positioning — the
          element starts scrolling with the page content instead of
          staying pinned to the viewport. Android Chrome doesn't have this
          bug, which is why it only showed up on iPhone. Moving the tab
          bar to be a sibling of the overflow-x-hidden div (rather than a
          child) sidesteps the bug entirely while keeping overflow-x-hidden
          for the rest of the page (still needed to stop stray horizontal
          scroll from some of the wide decorative animations). */}
      <MobileTabBar />
    </>
  );
}
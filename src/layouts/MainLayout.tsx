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
  const { isAuthenticated, hasHydrated } = useAppSelector((s) => s.auth);
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isChromeFree = location.pathname === '/get-started' || location.pathname === '/signup';

  // Navbar shows only once we're SURE the person is logged in. Before
  // hydration finishes, or if they're simply not logged in, it's hidden —
  // full stop, on every screen size.
  const showNavbar = hasHydrated && isAuthenticated;

  // eslint-disable-next-line no-console
  console.log('[MainLayout]', {
    path: location.pathname,
    hasHydrated,
    isAuthenticated,
    showNavbar,
    isDashboard,
    isChromeFree,
  });

  if (isDashboard) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  if (isChromeFree) {
    return <>{children}</>;
  }

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden pb-16 lg:pb-0">
      <ScrollProgress />
      {showNavbar && <Navbar />}
      <main>{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileTabBar />
    </div>
  );
}
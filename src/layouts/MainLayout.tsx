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
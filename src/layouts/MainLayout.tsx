import type { PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ScrollProgress } from '@/components/ScrollProgress';
import { MobileTabBar } from '@/components/MobileTabBar';
import { DashboardShell } from '@/layouts/DashboardShell';

export function MainLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/dashboard');

  if (isDashboard) {
    return <DashboardShell>{children}</DashboardShell>;
  }

  return (
    <div id="top" className="relative min-h-screen overflow-x-hidden pb-16 lg:pb-0">
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <div className="hidden lg:block">
        <Footer />
      </div>
      <MobileTabBar />
    </div>
  );
}

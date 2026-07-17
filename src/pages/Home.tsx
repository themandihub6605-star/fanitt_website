import { Navigate } from 'react-router-dom';
import { Hero } from '@/sections/Hero';
import { TrustBar } from '@/sections/TrustBar';
import { ProductShowcase } from '@/sections/ProductShowcase';
import { CreatorGrid } from '@/sections/CreatorGrid';
import { TopCreators } from '@/sections/TopCreators';
import { LatestPosts } from '@/sections/LatestPosts';
import { LiveSessionsRail } from '@/sections/LiveSessionsRail';
import { LiveSessionsShowcase } from '@/sections/LiveSessionsShowcase';
import { CategoryBrowse } from '@/sections/CategoryBrowse';
import { FreeSessions } from '@/sections/FreeSessions';
import { ForCreators } from '@/sections/ForCreators';
import { ForBrands } from '@/sections/ForBrands';
import { Testimonials } from '@/sections/Testimonials';
import { FAQSection } from '@/sections/FAQSection';
import { ClosingCTA } from '@/sections/ClosingCTA';
import { useAppSelector } from '@/store/hooks';

export default function Home() {
  const { isAuthenticated, user, hasHydrated } = useAppSelector((s) => s.auth);

  // Logged-in users land on their dashboard instead of the marketing page —
  // only decide once the initial auth check has finished, to avoid a flash.
  if (hasHydrated && isAuthenticated && user) {
    if (user.role === 'creator') return <Navigate to="/dashboard/creator" replace />;
    if (user.role === 'brand') return <Navigate to="/dashboard/brand" replace />;
    if (user.role === 'agency') return <Navigate to="/dashboard/agency" replace />;
  }

  return (
    <>
      <Hero />
      <TrustBar />
      <ProductShowcase />
      <CreatorGrid />
      <TopCreators />
      <LatestPosts />
      <LiveSessionsRail />
      <LiveSessionsShowcase />
      <CategoryBrowse />
      <FreeSessions />
      <ForCreators />
      <ForBrands />
      <Testimonials />
      <FAQSection />
      <ClosingCTA />
    </>
  );
}
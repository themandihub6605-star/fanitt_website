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

export default function Home() {
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
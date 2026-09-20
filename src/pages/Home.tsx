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
      {/* Temporarily hidden — stats look empty pre-launch (0+ sessions etc).
          Re-enable once there's real traction to show. */}
      {/* <TrustBar /> */}
      <ProductShowcase />
      {/* Temporarily hidden — too few real creators/posts yet to look full.
          Re-enable once there's enough content/creators live. */}
      {/* <CreatorGrid /> */}
      {/* <TopCreators /> */}
      {/* <LatestPosts /> */}
      <LiveSessionsRail />
      <LiveSessionsShowcase />
      {/* Temporarily hidden per request. */}
      {/* <CategoryBrowse /> */}
      <FreeSessions />
      <ForCreators />
      <ForBrands />
      <Testimonials />
      <FAQSection />
      <ClosingCTA />
    </>
  );
}
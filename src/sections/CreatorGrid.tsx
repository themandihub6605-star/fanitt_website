import { useEffect, useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Button } from '@/components/ui/Button';
import { PortraitCard } from '@/components/PortraitCard';
import { ParallaxItem } from '@/components/ParallaxItem';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';

export function CreatorGrid() {
  const [creators, setCreators] = useState<ApiCreator[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    creatorApi
      .list({ page: 1 })
      .then((d) => setCreators(d.creators.slice(0, 10)))
      .catch(() => setCreators([]))
      .finally(() => setLoaded(true));
  }, []);

  // no fake placeholder creators — if nobody's verified/live yet, hide the section
  if (loaded && creators.length === 0) return null;
  if (!loaded) return null;

  return (
    <section id="creators" className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Book a 1:1 Session" title="Meet creators taking bookings this week" className="!max-w-none" />
          <a href="/campaigns">
            <Button variant="outline" size="sm">View all creators</Button>
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {creators.map((creator, i) => (
            <ParallaxItem key={creator._id} speed={i % 2 === 0 ? 16 : -16} className={i >= 4 ? 'hidden sm:block' : ''}>
              <PortraitCard
                creator={{
                  name: creator.user.name,
                  specialty: creator.category?.label || '',
                  seed: creator._id,
                  followers: creator.followerCount >= 1000 ? `${Math.floor(creator.followerCount / 1000)}K` : String(creator.followerCount),
                  slug: creator.slug,
                  avatarUrl: creator.user.avatarUrl,
                }}
                index={i}
              />
            </ParallaxItem>
          ))}
        </div>
      </Container>
    </section>
  );
}

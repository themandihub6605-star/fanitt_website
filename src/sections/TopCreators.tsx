import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CreatorPosterCard } from '@/components/CreatorPosterCard';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';

export function TopCreators() {
  const [creators, setCreators] = useState<ApiCreator[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    creatorApi
      .list({ page: 1 })
      .then((d) => setCreators(d.creators.filter((c) => c.user).slice(0, 4)))
      .catch(() => setCreators([]))
      .finally(() => setLoaded(true));
  }, []);

  if (loaded && creators.length === 0) return null;
  if (!loaded) return null;

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-yellow-400/30 bg-yellow-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-300">
              Top Creators
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              The most-followed creators on Fanitt
            </h2>
          </div>
          <Link to="/explore">
            <Button variant="outline" size="sm">
              Explore all creators <ArrowRight size={15} />
            </Button>
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {creators.map((creator, i) => (
            <motion.div
              key={creator._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <CreatorPosterCard creator={creator} rank={i} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
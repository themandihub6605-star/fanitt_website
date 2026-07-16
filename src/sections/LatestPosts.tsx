import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { FeedPostCard } from '@/components/FeedPostCard';
import { postApi, type ApiPost } from '@/services/postApi';

export function LatestPosts() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    postApi
      .getFeed(4)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoaded(true));
  }, []);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (loaded && posts.length === 0) return null;
  if (!loaded) return null;

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-300">
              Fresh
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest from creators</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden gap-2 sm:flex">
              <button
                onClick={() => scrollByAmount(-1)}
                aria-label="Scroll left"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollByAmount(1)}
                aria-label="Scroll right"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <Link to="/feed">
              <Button variant="outline" size="sm">
                View Feed <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-8 flex gap-5 overflow-x-auto pb-3 pr-6 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="w-[280px] shrink-0 sm:w-[300px]"
            >
              <FeedPostCard post={post} compact />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
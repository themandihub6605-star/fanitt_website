import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useParallax } from '@/hooks/useParallax';
import { reviewApi, type ApiReview } from '@/services/reviewApi';

export function Testimonials() {
  const { ref: parallaxRef, y } = useParallax(16);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    reviewApi
      .getFeatured(8)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoaded(true));
  }, []);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  // no fake placeholder reviews — if the platform has none yet, hide the section
  if (loaded && reviews.length === 0) return null;
  if (!loaded) return null;

  return (
    <section ref={parallaxRef} className="relative overflow-hidden py-section-mobile md:py-section">
      <motion.div
        style={{ y }}
        className="pointer-events-none absolute -top-20 right-[-10%] h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
      />
      <Container className="relative">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionTitle eyebrow="Community Reviews" title="Fans, creators & brands on Fanitt" className="!max-w-none" />
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scrollByAmount(-1)}
              aria-label="Scroll reviews left"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => scrollByAmount(1)}
              aria-label="Scroll reviews right"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-10 flex gap-5 overflow-x-auto pb-4 pr-6 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {reviews.map((r, i) => (
            <motion.div
              key={r._id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: (i % 4) * 0.08 }}
              whileHover={{ y: -8, rotate: i % 2 === 0 ? -1 : 1, scale: 1.02 }}
              className="w-[300px] shrink-0 rounded-2xl bg-navy-800/70 backdrop-blur-xl border border-white/10 p-6 shadow-card transition-shadow duration-300 hover:shadow-lifted"
            >
              <Quote className="text-orange-400" size={22} />
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/80">{r.comment}</p>
              <div className="mt-5 flex items-center gap-3">
                {r.fromUser.avatarUrl ? (
                  <img src={r.fromUser.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" width={40} height={40} loading="lazy" />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300">
                    {r.fromUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{r.fromUser.name}</p>
                  <p className="text-xs capitalize text-white/60">{r.fromUser.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
          <div className="w-px shrink-0" aria-hidden="true" />
        </div>
      </Container>
    </section>
  );
}

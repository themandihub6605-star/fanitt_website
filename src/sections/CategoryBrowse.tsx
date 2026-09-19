import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { CategoryCard } from '@/components/CategoryCard';
import { ParallaxItem } from '@/components/ParallaxItem';
import { CATEGORIES } from '@/constants/content';
import { cn } from '@/utils/cn';

export function CategoryBrowse() {
  const [filter, setFilter] = useState<string>('All');
  const filtered = filter === 'All' ? CATEGORIES : CATEGORIES.filter((c) => c.label === filter);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 220, behavior: 'smooth' });
  };

  return (
    <section id="categories" className="py-section-mobile md:py-section">
      <Container>
        <SectionTitle eyebrow="Categories" title="Pick a category. Start collaborating." align="center" className="mx-auto" />

        <div className="mt-8 flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll categories left"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 shadow-soft transition-colors duration-200 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-400 sm:flex"
          >
            <ChevronLeft size={16} />
          </motion.button>

          <div className="relative min-w-0 flex-1">
            {/* edge fades so the scroll affordance reads clearly instead of a hard cut */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#0A0A0A] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#0A0A0A] to-transparent" />

            <div
              ref={scrollerRef}
              className="flex gap-2.5 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {['All', ...CATEGORIES.map((c) => c.label)].map((label) => {
                const active = filter === label;
                return (
                  <motion.button
                    key={label}
                    onClick={() => setFilter(label)}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={cn(
                      'relative shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ease-out',
                      active
                        ? 'border-orange-500 bg-orange-500 text-white shadow-glow'
                        : 'border-white/15 bg-white/5 text-white/70 hover:border-orange-300/50 hover:bg-white/10 hover:text-orange-300'
                    )}
                  >
                    {label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll categories right"
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 shadow-soft transition-colors duration-200 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-400 sm:flex"
          >
            <ChevronRight size={16} />
          </motion.button>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {filtered.map((cat, i) => (
            <ParallaxItem key={cat.label} speed={i % 2 === 0 ? -16 : 16}>
              <CategoryCard category={cat} index={i} />
            </ParallaxItem>
          ))}
        </div>
      </Container>
    </section>
  );
}
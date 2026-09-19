import { useRef, useState } from 'react';
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
          <button
            onClick={() => scrollByAmount(-1)}
            aria-label="Scroll categories left"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-500 sm:flex"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={scrollerRef}
            className="flex flex-1 gap-2.5 overflow-x-auto scroll-smooth px-1 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {['All', ...CATEGORIES.map((c) => c.label)].map((label) => (
              <button
                key={label}
                onClick={() => setFilter(label)}
                className={cn(
                  'shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                  filter === label
                    ? 'border-orange-500 bg-orange-500 text-white'
                    : 'border-white/15 bg-white/10 text-white/70 hover:border-orange-300 hover:text-orange-500'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => scrollByAmount(1)}
            aria-label="Scroll categories right"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-500 sm:flex"
          >
            <ChevronRight size={16} />
          </button>
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

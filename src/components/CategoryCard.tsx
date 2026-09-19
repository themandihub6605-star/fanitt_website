import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { resolveIcon } from '@/utils/icons';
import { slugify } from '@/utils/slugify';
import { cn } from '@/utils/cn';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

// Rotating brand-colored accent per card — a consistent treatment applied to
// every category photo so they all read as one cohesive, vibrant family
// instead of ten random stock photos of wildly different tone/brightness.
const ACCENTS = [
  { wash: 'from-orange-500/50 via-orange-500/10', border: 'group-hover:border-orange-500/40', bar: 'from-orange-500 via-pink-500 to-yellow-400', chip: 'group-hover:bg-orange-500' },
  { wash: 'from-teal-400/50 via-teal-400/10', border: 'group-hover:border-teal-400/40', bar: 'from-teal-400 via-cyan-400 to-sky-400', chip: 'group-hover:bg-teal-500' },
  { wash: 'from-pink-500/50 via-pink-500/10', border: 'group-hover:border-pink-500/40', bar: 'from-pink-500 via-fuchsia-500 to-orange-400', chip: 'group-hover:bg-pink-500' },
  { wash: 'from-yellow-400/50 via-yellow-400/10', border: 'group-hover:border-yellow-400/40', bar: 'from-yellow-400 via-orange-400 to-pink-400', chip: 'group-hover:bg-yellow-500' },
  { wash: 'from-sky-400/50 via-sky-400/10', border: 'group-hover:border-sky-400/40', bar: 'from-sky-400 via-teal-400 to-emerald-400', chip: 'group-hover:bg-sky-500' },
];

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const Icon = resolveIcon(category.icon);
  const accent = ACCENTS[index % ACCENTS.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: (index % 5) * 0.06 }}
    >
      <Link
        to={`/category/${slugify(category.label)}`}
        className={cn(
          'group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/[0.06] shadow-card transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-lifted',
          accent.border
        )}
      >
        {/* Saturation/contrast boost so every photo — dark or light — pops
            against the black page background instead of blending into it. */}
        <img
          src={getCoverPhoto(category.label, 400, 500)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover brightness-[1.08] contrast-[1.08] saturate-[1.35] transition-transform duration-500 ease-out group-hover:scale-110"
        />

        {/* Brand-color wash, same treatment on every card, rotating hue —
            this is what makes the whole row feel like one unified, colorful
            set instead of random stock photography. */}
        <div className={cn('absolute inset-0 bg-gradient-to-br mix-blend-overlay', accent.wash)} />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/10 to-transparent" />

        <span className={cn('pointer-events-none absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gradient-to-r transition-transform duration-300 ease-out group-hover:scale-x-100', accent.bar)} />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className={cn('mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-transform duration-300 ease-out group-hover:scale-110', accent.chip)}>
            <Icon size={16} />
          </span>
          <p className="text-sm font-bold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.5)]">{category.label}</p>
        </div>
      </Link>
    </motion.div>
  );
}
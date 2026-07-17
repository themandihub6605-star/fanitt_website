import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { resolveIcon } from '@/utils/icons';
import { slugify } from '@/utils/slugify';
import type { Category } from '@/types';

interface CategoryCardProps {
  category: Category;
  index?: number;
}

export function CategoryCard({ category, index = 0 }: CategoryCardProps) {
  const Icon = resolveIcon(category.icon);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: (index % 5) * 0.06 }}
    >
      <Link
        to={`/category/${slugify(category.label)}`}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted"
      >
        <img
          src={getCoverPhoto(category.label, 400, 500)}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/90 via-navy-900/20 to-navy-900/10" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm">
            <Icon size={16} />
          </span>
          <p className="text-sm font-bold text-white">{category.label}</p>
        </div>
      </Link>
    </motion.div>
  );
}

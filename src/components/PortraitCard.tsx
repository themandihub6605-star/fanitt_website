import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getAvatar } from '@/utils/avatar';
import type { Creator } from '@/types';

interface PortraitCardProps {
  creator: Creator & { avatarUrl?: string };
  index?: number;
}

export function PortraitCard({ creator, index = 0 }: PortraitCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, delay: (index % 5) * 0.07 }}
      whileHover={{ y: -6 }}
    >
      <Link
        to={creator.slug ? `/creator/${creator.slug}` : '#'}
        className="group relative block aspect-square w-full shrink-0 overflow-hidden rounded-2xl shadow-card transition-shadow duration-300 hover:shadow-lifted"
      >
        <img
          src={creator.avatarUrl || getAvatar(creator.seed, 400)}
          alt={creator.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-sm font-bold uppercase tracking-wide text-white">{creator.name}</p>
          <p className="mt-0.5 text-xs leading-snug text-white/70">{creator.specialty}</p>
          <span className="mt-2 inline-block rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
            {creator.followers} followers
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

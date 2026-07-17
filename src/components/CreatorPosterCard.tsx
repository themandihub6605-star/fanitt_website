import { Link } from 'react-router-dom';
import { Star, Users, BadgeCheck } from 'lucide-react';
import type { ApiCreator } from '@/services/creatorApi';

interface CreatorPosterCardProps {
  creator: ApiCreator;
  rank?: number;
}

export function CreatorPosterCard({ creator, rank }: CreatorPosterCardProps) {
  return (
    <Link
      to={`/creator/${creator.slug}`}
      className="group relative block aspect-[3/4] w-full overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted"
    >
      <img
        src={creator.user.avatarUrl || `https://i.pravatar.cc/500?u=${creator._id}`}
        alt={creator.user.name}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/0" />

      {rank !== undefined && (
        <span
          className={
            rank === 0
              ? 'absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-navy-900 shadow-lg'
              : 'absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-xs font-bold text-white backdrop-blur-sm'
          }
        >
          #{rank + 1}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex items-center gap-1">
          <p className="truncate text-base font-bold text-white">{creator.user.name}</p>
          <BadgeCheck size={15} className="shrink-0 fill-emerald-500 text-white" strokeWidth={2.5} />
        </div>
        <p className="truncate text-xs text-white/70">{creator.category?.label}</p>
        {creator.bio && <p className="mt-1 line-clamp-1 text-xs text-white/50">{creator.bio}</p>}

        <div className="mt-2.5 flex items-center gap-3 text-xs">
          {creator.averageRating > 0 && (
            <span className="flex items-center gap-1 font-bold text-yellow-300">
              <Star size={12} fill="currentColor" /> {creator.averageRating}
            </span>
          )}
          <span className="flex items-center gap-1 font-semibold text-white/80">
            <Users size={12} />
            {creator.followerCount >= 1000 ? `${(creator.followerCount / 1000).toFixed(1)}K` : creator.followerCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
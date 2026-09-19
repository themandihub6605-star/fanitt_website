import { Link } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { getUploadUrl } from '@/services/apiClient';
import type { ApiSession } from '@/services/sessionApi';

interface RecommendedSessionCardProps {
  session: ApiSession;
}

/** Compact "Recommended for you" rail card matching the dashboard reference —
 * shows real session state only (isLive, bookedCount), no fabricated metrics. */
export function RecommendedSessionCard({ session }: RecommendedSessionCardProps) {
  const categoryLabel = typeof session.category === 'string' ? session.category : session.category?.label;
  const creatorName = session.creator?.user?.name || 'Creator';
  const bannerSrc = session.coverImageUrl ? getUploadUrl(session.coverImageUrl) : getCoverPhoto(categoryLabel || 'Business Coaching', 400, 400);
  const isUpcoming = !session.isLive;

  return (
    <Link to={`/sessions?highlight=${session._id}`} className="group w-[220px] shrink-0 sm:w-[260px]">
      <div className="relative h-36 overflow-hidden rounded-2xl sm:h-40">
        <img src={bannerSrc} alt={session.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          {session.isLive ? (
            <span className="flex items-center gap-1 rounded-full bg-red-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> Live
            </span>
          ) : (
            <span className="rounded-full bg-yellow-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-black">Upcoming</span>
          )}
          {session.bookedCount > 0 && (
            <span className="rounded-full bg-black/50 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-sm">{session.bookedCount} booked</span>
          )}
        </div>

        <div className="absolute inset-x-2.5 bottom-2.5 flex flex-wrap gap-1.5">
          {categoryLabel && (
            <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">{categoryLabel}</span>
          )}
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm capitalize">{session.type.replace('_', ' ')}</span>
        </div>
      </div>

      <div className="mt-2.5">
        <p className="line-clamp-1 text-sm font-bold text-white">{session.title}</p>
        <p className="mt-0.5 text-xs text-white/50">{creatorName}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/40">
          <BadgeCheck size={12} className="fill-sky-500 text-white" strokeWidth={2.5} /> Fanitt Live
        </p>
        {isUpcoming && (
          <p className="mt-1 text-[11px] font-semibold text-orange-400">
            {new Date(session.scheduledAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
          </p>
        )}
      </div>
    </Link>
  );
}

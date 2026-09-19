import { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { getUploadUrl } from '@/services/apiClient';
import { cn } from '@/utils/cn';
import { RealBookingModal } from './ui/RealBookingModal';
import type { ApiSession } from '@/services/sessionApi';

interface ApiSessionCardProps {
  session: ApiSession;
  className?: string;
}

export function ApiSessionCard({ session, className }: ApiSessionCardProps) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const isFree = session.type === 'free';
  const categoryLabel = typeof session.category === 'string' ? session.category : session.category?.label;
  const creatorName = session.creator?.user?.name || 'Creator';
  const bannerSrc = session.coverImageUrl ? getUploadUrl(session.coverImageUrl) : getCoverPhoto(categoryLabel || 'Business Coaching', 400, 400);

  return (
    <>
      <div
        className={cn(
          'w-[240px] shrink-0 overflow-hidden rounded-2xl bg-navy-800/70 backdrop-blur-xl border border-white/10 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted sm:w-[300px]',
          className
        )}
      >
        <div className="relative h-44 sm:h-52">
          <img
            src={bannerSrc}
            alt={session.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/75 via-navy-900/10 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {categoryLabel}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                isFree ? 'bg-white text-teal-600' : 'bg-white/90 text-orange-600'
              )}
            >
              {isFree ? 'Free' : 'Paid'}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">{session.title}</h3>
          <p className="mt-1 text-xs text-white/60">{creatorName}</p>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-white/70">
              <Clock size={11} /> {new Date(session.scheduledAt).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
            <span className={cn('font-bold', isFree ? 'text-teal-400' : 'text-white')}>
              {isFree ? 'Free' : `₹${(session.price / 100).toLocaleString('en-IN')}`}
            </span>
          </div>

          <button
            onClick={() => setBookingOpen(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
          >
            Book Now <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <RealBookingModal session={session} open={bookingOpen} onClose={() => setBookingOpen(false)} />
    </>
  );
}
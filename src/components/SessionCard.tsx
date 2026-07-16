import { useState } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { cn } from '@/utils/cn';
import { BookingModal } from '@/components/ui/BookingModal';
import type { LiveSession } from '@/types';

interface SessionCardProps {
  session: LiveSession;
  index?: number;
  className?: string;
  showBookButton?: boolean;
}

export function SessionCard({ session, className, showBookButton = true }: SessionCardProps) {
  const [bookingOpen, setBookingOpen] = useState(false);

  return (
    <>
      <div
        className={cn(
          'w-[240px] shrink-0 overflow-hidden rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted sm:w-[300px]',
          className
        )}
      >
        <div className="relative h-44 sm:h-52">
          <img
            src={getCoverPhoto(session.category, 400, 400)}
            alt={session.category}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-navy-900/75 via-navy-900/10 to-transparent" />

          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            <span className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {session.category}
            </span>
            <span
              className={cn(
                'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide',
                session.free ? 'bg-white text-teal-600' : 'bg-white/90 text-orange-600'
              )}
            >
              {session.free ? 'Free' : 'Live'}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">{session.title}</h3>
          <p className="mt-1 text-xs text-white/60">
            {session.creatorName} · {session.creatorTag}
          </p>

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <span className="flex items-center gap-1 font-semibold text-white/70">
              <Clock size={11} /> {session.day.split(',')[0]} · {session.time}
            </span>
            <span className={cn('font-bold', session.free ? 'text-teal-400' : 'text-white')}>
              {session.free ? 'Recording available' : session.price}
            </span>
          </div>

          {showBookButton && (
            <button
              onClick={() => setBookingOpen(true)}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-orange-500 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
            >
              Book Now <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {showBookButton && (
        <BookingModal session={session} open={bookingOpen} onClose={() => setBookingOpen(false)} />
      )}
    </>
  );
}

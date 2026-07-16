import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { getAvatar } from '@/utils/avatar';
import { cn } from '@/utils/cn';
import type { LiveSession } from '@/types';

const SLOTS = ['9:00 AM', '11:30 AM', '2:00 PM', '4:30 PM', '7:00 PM'];

interface BookingModalProps {
  session: LiveSession;
  open: boolean;
  onClose: () => void;
}

export function BookingModal({ session, open, onClose }: BookingModalProps) {
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    onClose();
    // reset after the close animation finishes so it doesn't flash on reopen
    setTimeout(() => {
      setSlot(null);
      setConfirmed(false);
    }, 250);
  };

  return (
    <Modal open={open} onClose={handleClose} title={confirmed ? undefined : 'Book this session'}>
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-white/[0.05] p-3">
              <img
                src={getAvatar(session.creatorSeed, 100)}
                alt={session.creatorName}
                className="h-11 w-11 rounded-full object-cover"
                width={44}
                height={44}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{session.title}</p>
                <p className="text-xs text-white/60">
                  {session.creatorName} · {session.creatorTag}
                </p>
              </div>
            </div>

            <p className="mt-5 text-sm font-semibold text-white">Select a time — {session.day}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={cn(
                    'rounded-lg border py-2.5 text-center text-sm font-semibold transition-colors',
                    slot === s
                      ? 'border-orange-500 bg-orange-500 text-white'
                      : 'border-white/10 bg-white/[0.06] text-white/80 hover:border-orange-300'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl bg-white/[0.05] px-4 py-3 text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Clock size={14} /> {session.duration}
              </span>
              <span className={cn('font-bold', session.free ? 'text-teal-400' : 'text-white')}>
                {session.free ? 'Free' : session.price}
              </span>
            </div>

            <Button className="mt-6 w-full" disabled={!slot} onClick={() => setConfirmed(true)}>
              {slot ? `Confirm booking · ${slot}` : 'Select a time to continue'}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-white"
            >
              <Check size={26} />
            </motion.span>
            <h3 className="mt-4 text-xl font-bold text-white">You're booked!</h3>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              {session.title} with {session.creatorName} — confirmed for {slot} on {session.day}. A reminder
              will be sent before it goes live.
            </p>
            <Button variant="outline" className="mt-6" onClick={handleClose}>
              Done
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

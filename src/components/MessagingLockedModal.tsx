import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';

/** Shown when a Lite creator/brand tries to message someone — messaging
 * is a Pro-only feature (regardless of the other person's plan). Mirrors
 * ComingSoonModal's shape but with an actual upgrade CTA instead of a
 * dismiss-only "Got it". */
export function MessagingLockedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.97 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-navy-900 p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
              <MessageCircle size={24} />
            </span>

            <h2 className="mt-4 text-lg font-bold text-white">Messaging is a Pro feature</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Upgrade your plan to message creators and brands directly on Fanitt.
            </p>

            <Link
              to="/pricing"
              onClick={onClose}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600"
            >
              Upgrade to Pro
            </Link>
            <button onClick={onClose} className="mt-3 text-xs font-semibold text-white/40 hover:text-white/70">
              Maybe later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
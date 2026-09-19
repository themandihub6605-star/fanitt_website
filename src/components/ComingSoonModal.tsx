import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export function ComingSoonModal({
  open,
  onClose,
  title = 'Marketplace Coming Soon',
  message = "We're putting the finishing touches on this. Check back soon — it'll be worth the wait.",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
}) {
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
              <Sparkles size={24} />
            </span>

            <h2 className="mt-4 text-lg font-bold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{message}</p>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
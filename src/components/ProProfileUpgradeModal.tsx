import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Crown } from 'lucide-react';

/** Shown to a Lite creator/brand the moment they open a Pro/Elite
 * creator's or brand's profile — nudges them to upgrade without
 * blocking the profile itself (dismissible, content underneath still
 * fully viewable). Fires once per profile page open, not repeatedly. */
export function ProProfileUpgradeModal({
  open,
  onClose,
  name,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
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
            className="relative w-full max-w-sm rounded-3xl border border-orange-400/20 bg-navy-900 p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]">
              <Crown size={24} className="text-white" />
            </span>

            <h2 className="mt-4 text-lg font-bold text-white">{name} is on the Pro plan</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              You're on the Lite plan. Upgrade to Pro to unlock full access — messaging, exclusive campaigns, and more.
            </p>

            <Link
              to="/pricing"
              onClick={onClose}
              className="mt-6 flex w-full items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3 text-sm font-bold text-white hover:opacity-90"
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
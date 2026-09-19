import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Crown } from 'lucide-react';

const COPY: Record<'creator' | 'brand' | 'campaign', { heading: string; body: string }> = {
  creator: {
    heading: 'This creator is on the Pro plan',
    body: "You're on the Lite plan. Upgrade to Pro to view full creator profiles, message directly, and unlock more.",
  },
  brand: {
    heading: 'This brand is on the Pro plan',
    body: "You're on the Lite plan. Upgrade to Pro to view full brand profiles, message directly, and unlock more.",
  },
  campaign: {
    heading: 'This is an exclusive campaign',
    body: 'This campaign is only open to Pro creators. Upgrade your plan to apply.',
  },
};

/** Shown when a Lite creator/brand tries to open a Pro/Elite creator's or
 * brand's profile, or an exclusive campaign, from a listing page — blocks
 * the navigation (see handleCardClick in ExploreCreators.tsx /
 * ExploreBrands.tsx / Campaigns.tsx) and nudges them to upgrade instead.
 * `kind` only changes the copy, not the CTA. */
export function ProfileLockedModal({
  open,
  onClose,
  kind,
}: {
  open: boolean;
  onClose: () => void;
  kind: 'creator' | 'brand' | 'campaign';
}) {
  const copy = COPY[kind];

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
            className="relative w-full max-w-sm rounded-2xl border border-orange-400/20 bg-navy-900 p-6 text-center"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>

            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]">
              <Crown size={24} className="text-white" />
            </span>

            <h2 className="mt-4 text-lg font-bold text-white">{copy.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{copy.body}</p>

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
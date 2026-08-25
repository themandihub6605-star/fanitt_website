import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, Zap, TrendingUp, Crown } from 'lucide-react';
import { subscriptionApi } from '@/services/subscriptionApi';
import { useAppSelector } from '@/store/hooks';

const CREATOR_COPY = {
  eyebrow: 'Unlock Your Full Potential',
  title: 'Level Up Your Creator Game',
  subtitle: 'You\'re on the Lite plan. Go Pro and get 3x the reach for less than a coffee a day.',
  perks: [
    { icon: Zap, text: '90 proposals/month instead of 30' },
    { icon: TrendingUp, text: 'Only 5% platform fee, not 9%' },
    { icon: Crown, text: 'Access to exclusive brand campaigns' },
    { icon: Sparkles, text: '6-hour early access before Lite creators' },
  ],
  ctaLabel: 'Upgrade to Pro — ₹600/mo',
};

const BRAND_COPY = {
  eyebrow: 'Reach More Creators, Faster',
  title: 'Unlock More Campaigns',
  subtitle: 'You\'re on the Lite plan. Upgrade to post more campaigns and get seen by top-tier creators first.',
  perks: [
    { icon: Zap, text: 'Post up to 6 campaigns a year (or unlimited on Elite)' },
    { icon: Crown, text: 'Exclusive visibility to Pro creators only' },
    { icon: TrendingUp, text: 'Set applicant limits on your campaigns' },
    { icon: Sparkles, text: 'Elite plans get Featured placement' },
  ],
  ctaLabel: 'See Brand Plans',
};

function getStorageKey(userId: string) {
  return `fanitt_upgrade_prompt_${userId}`;
}

function alreadyShownToday(userId: string) {
  const stored = localStorage.getItem(getStorageKey(userId));
  if (!stored) return false;
  const today = new Date().toDateString();
  return stored === today;
}

function markShownToday(userId: string) {
  localStorage.setItem(getStorageKey(userId), new Date().toDateString());
}

/** Shown once per calendar day to Creator/Brand users still on their free
 * (Lite) plan — rendered inside DashboardShell so it appears the moment
 * they land on any dashboard page, mobile or desktop. Dismissing or
 * upgrading both mark it seen for today; it reappears tomorrow if they're
 * still on the free plan. */
export function UpgradePromptModal() {
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || (user.role !== 'creator' && user.role !== 'brand')) return;
    if (alreadyShownToday(user._id)) return;

    let cancelled = false;
    subscriptionApi
      .getMySubscription()
      .then((sub) => {
        if (cancelled) return;
        if (sub?.plan?.price === 0) {
          // Small delay so it doesn't slam the person the instant the page paints.
          setTimeout(() => {
            if (!cancelled) setOpen(true);
          }, 1200);
        }
      })
      .catch(() => {
        // No subscription record yet / endpoint hiccup — fail silently, not worth blocking the dashboard over.
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const close = () => {
    if (user) markShownToday(user._id);
    setOpen(false);
  };

  const handleUpgrade = () => {
    if (user) markShownToday(user._id);
    setOpen(false);
    navigate('/pricing');
  };

  if (!user) return null;
  const copy = user.role === 'brand' ? BRAND_COPY : CREATOR_COPY;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-orange-400/20 bg-navy-900 shadow-[0_0_60px_-10px_rgba(249,68,30,0.35)]"
          >
            {/* decorative gradient glow */}
            <div className="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,106,31,0.35)_0%,transparent_70%)]" />

            <button
              onClick={close}
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
            >
              <X size={16} />
            </button>

            <div className="relative px-7 pt-9 pb-7 text-center sm:px-8">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] shadow-glow">
                <Crown size={26} className="text-white" />
              </span>

              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-orange-300">{copy.eyebrow}</p>
              <h2 className="mt-1.5 text-2xl font-bold leading-tight text-white sm:text-[1.7rem]">{copy.title}</h2>
              <p className="mx-auto mt-2.5 max-w-sm text-sm leading-relaxed text-white/60">{copy.subtitle}</p>

              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                {copy.perks.map((perk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + i * 0.08 }}
                    className="flex items-center gap-3"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-300">
                      <perk.icon size={14} />
                    </span>
                    <span className="text-sm text-white/80">{perk.text}</span>
                  </motion.div>
                ))}
              </div>

              <button
                onClick={handleUpgrade}
                className="mt-6 w-full rounded-full bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)] py-3.5 text-sm font-bold text-white shadow-glow transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {copy.ctaLabel}
              </button>

              <button onClick={close} className="mt-3 text-xs font-semibold text-white/40 hover:text-white/70">
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
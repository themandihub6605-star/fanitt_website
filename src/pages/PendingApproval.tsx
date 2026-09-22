import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, LogOut, AlertCircle, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';
import { agencyApi } from '@/services/agencyApi';

type Status = 'unverified' | 'pending' | 'verified' | 'rejected';

const EDIT_ROUTE: Record<string, string> = {
  creator: '/dashboard/creator/edit',
  brand: '/dashboard/brand/edit',
  agency: '/dashboard/agency/edit',
};

// Per-status accent used for the ambient glow, the top bar and the icon ring —
// keeps the page visually tied to what's actually happening (red = rejected,
// yellow = incomplete, orange = in review).
const STATUS_ACCENT: Record<'rejected' | 'unverified' | 'default', string> = {
  rejected: '#EF4444',
  unverified: '#FACC15',
  default: '#FF6A1F',
};

export default function PendingApproval() {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const { logout } = useAuth();

  const [status, setStatus] = useState<Status | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);

  // Agency signups pass their agency name through navigation state so this
  // screen greets by agency name, not the individual's personal name —
  // matches Signup's own review step. Falls back to the person's name for
  // Creator/Brand, or if the state wasn't passed (e.g. direct navigation).
  const displayName = (location.state as { displayName?: string } | null)?.displayName || user?.name;

  useEffect(() => {
    if (!user) return;
    const fetcher = user.role === 'agency' ? agencyApi.getMyProfile : user.role === 'brand' ? brandApi.getMyProfile : creatorApi.getMyProfile;
    fetcher()
      .then((p: any) => {
        setStatus(p.verificationStatus || 'pending');
        setRejectionReason(p.rejectionReason || '');
      })
      .catch(() => setStatus('pending'))
      .finally(() => setLoading(false));
  }, [user]);

  const editRoute = user ? EDIT_ROUTE[user.role] : undefined;

  const accent = status === 'rejected' ? STATUS_ACCENT.rejected : status === 'unverified' ? STATUS_ACCENT.unverified : STATUS_ACCENT.default;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0A0A0A] px-6 py-12 text-center">
      {/* Ambient background — glow tinted to the current status, plus a faint dot grid for texture */}
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-[-12%] h-[30rem] w-[30rem] -translate-x-1/2 rounded-full blur-[140px]"
          style={{ background: accent, opacity: 0.16 }}
          animate={{ opacity: [0.12, 0.2, 0.12] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '26px 26px' }}
        />
      </div>

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="relative mb-8">
        <Logo className="h-9 w-auto" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-navy-800/60 p-8 shadow-lifted backdrop-blur-sm sm:p-9"
      >
        {/* Status-tinted accent bar along the top edge of the card */}
        <span
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
        />

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center gap-4 py-8"
            >
              <Loader2 size={26} className="animate-spin text-white/40" />
              <p className="text-sm text-white/40">Checking your application status...</p>
            </motion.div>
          ) : status === 'rejected' ? (
            <motion.div key="rejected" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <StatusIcon color="red" icon={AlertCircle} pulse />
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Your application wasn't approved</h1>
              {rejectionReason && (
                <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/[0.07] p-4 text-left">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-red-300">Reason</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/80">{rejectionReason}</p>
                </div>
              )}
              <p className="mt-4 text-sm leading-relaxed text-white/55">Update your details and resubmit — our team will take another look.</p>

              {editRoute && (
                <Link to={editRoute}>
                  <Button className="mt-6 w-full justify-center gap-2">
                    Edit &amp; Resubmit <ArrowRight size={16} />
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : status === 'unverified' ? (
            <motion.div key="unverified" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <StatusIcon color="yellow" icon={ShieldAlert} pulse />
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Finish setting up your profile</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {displayName ? `Hi ${displayName} — ` : ''}your account was created, but your details haven't been submitted for review yet.
              </p>
              {editRoute && (
                <Link to={editRoute}>
                  <Button className="mt-6 w-full justify-center gap-2">
                    Complete Profile <ArrowRight size={16} />
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <motion.div key="pending" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <StatusIcon color="orange" icon={Clock} spin />
              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white">Your details are under review</h1>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {displayName ? `Thanks, ${displayName}! ` : ''}
                Your details have been sent to the Fanitt team. We'll review and connect with you within 24 hours to activate your{' '}
                <span className="font-semibold text-white/75">
                  {user?.role === 'agency' ? 'agency' : user?.role === 'brand' ? 'brand' : 'creator'}
                </span>{' '}
                dashboard.
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="h-1.5 w-1.5 rounded-full bg-orange-400"
                      animate={{ opacity: [0.25, 1, 0.25] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                    />
                  ))}
                </span>
                <span className="text-xs font-medium text-white/50">In review</span>
              </div>

              <p className="mt-4 text-xs text-white/35">You'll be able to access your dashboard as soon as our team approves your profile.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={logout}
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30 hover:text-white"
        >
          <LogOut size={15} /> Log out
        </button>
      </motion.div>
    </div>
  );
}

// Icon badge used at the top of each status card — a soft tinted circle with
// an optional pulsing ring (steady states) or a spinning dashed ring (the
// "in progress" pending state), so the icon itself communicates the status
// at a glance before the person reads any text.
function StatusIcon({
  color,
  icon: Icon,
  pulse,
  spin,
}: {
  color: 'red' | 'yellow' | 'orange';
  icon: typeof Clock;
  pulse?: boolean;
  spin?: boolean;
}) {
  const palette = {
    red: { bg: 'bg-red-500/15', text: 'text-red-400', ring: 'border-red-400/40' },
    yellow: { bg: 'bg-yellow-400/15', text: 'text-yellow-300', ring: 'border-yellow-300/40' },
    orange: { bg: 'bg-orange-500/15', text: 'text-orange-400', ring: 'border-orange-400/40' },
  }[color];

  return (
    <span className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-full ${palette.bg} ${palette.text}`}>
      {pulse && (
        <motion.span
          className={`absolute inset-0 rounded-full border-2 ${palette.ring}`}
          animate={{ scale: [1, 1.45], opacity: [0.6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
      {spin && (
        <motion.span
          className={`absolute -inset-1.5 rounded-full border-2 border-dashed ${palette.ring}`}
          animate={{ rotate: 360 }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
        />
      )}
      <Icon size={28} />
    </span>
  );
}
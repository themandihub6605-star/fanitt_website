import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut, AlertCircle, ShieldAlert, Loader2 } from 'lucide-react';
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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
      <Logo className="mb-8 h-9 w-auto" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-navy-800/60 p-8 shadow-lifted"
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 size={24} className="animate-spin text-white/40" />
          </div>
        ) : status === 'rejected' ? (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <AlertCircle size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-white">Your application wasn't approved</h1>
            {rejectionReason && (
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-left">
                <p className="text-xs font-bold uppercase tracking-wide text-red-300">Reason</p>
                <p className="mt-1 text-sm text-white/80">{rejectionReason}</p>
              </div>
            )}
            <p className="mt-4 text-sm leading-relaxed text-white/60">Update your details and resubmit — our team will take another look.</p>

            {editRoute && (
              <Link to={editRoute}>
                <Button className="mt-6 w-full justify-center">Edit &amp; Resubmit</Button>
              </Link>
            )}
          </>
        ) : status === 'unverified' ? (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400/15 text-yellow-300">
              <ShieldAlert size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-white">Finish setting up your profile</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {displayName ? `Hi ${displayName} — ` : ''}your account was created, but your details haven't been submitted for review yet.
            </p>
            {editRoute && (
              <Link to={editRoute}>
                <Button className="mt-6 w-full justify-center">Complete Profile</Button>
              </Link>
            )}
          </>
        ) : (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
              <Clock size={28} />
            </span>
            <h1 className="mt-5 text-2xl font-bold text-white">Your details are under review</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              {displayName ? `Thanks, ${displayName}! ` : ''}
              Your details have been sent to the Fanitt team. We'll review and connect with you within 24 hours to activate your{' '}
              {user?.role === 'agency' ? 'agency' : user?.role === 'brand' ? 'brand' : 'creator'} dashboard.
            </p>
            <p className="mt-3 text-xs text-white/40">You'll be able to access your dashboard as soon as our team approves your profile.</p>
          </>
        )}

        <button
          type="button"
          onClick={logout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold text-white/70 hover:border-white/30"
        >
          <LogOut size={15} /> Log out
        </button>
      </motion.div>
    </div>
  );
}
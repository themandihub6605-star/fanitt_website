import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, LogOut } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useAppSelector } from '@/store/hooks';

export default function PendingApproval() {
  const user = useAppSelector((s) => s.auth.user);
  const location = useLocation();
  const { logout } = useAuth();

  // Agency signups pass their agency name through navigation state so this
  // screen greets by agency name, not the individual's personal name —
  // matches Signup's own review step. Falls back to the person's name for
  // Creator/Brand, or if the state wasn't passed (e.g. direct navigation).
  const displayName = (location.state as { displayName?: string } | null)?.displayName || user?.name;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center">
      <Logo className="mb-8 h-9 w-auto" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-[2rem] border border-white/10 bg-navy-800/60 p-8 shadow-lifted"
      >
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
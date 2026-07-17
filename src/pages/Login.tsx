import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Loader2, ShieldCheck, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { GoogleIcon } from '@/components/GoogleIcon';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/apiClient';

// Same real feature list the product already uses to describe itself —
// not decorative filler, this is what Fanitt actually does.
const FEATURES = [
  { icon: Sparkles, title: 'Opportunities that match you', description: 'Discover campaigns, gigs and collaborations that fit your talent and goals.' },
  { icon: ShieldCheck, title: 'Build trust & reputation', description: 'Work, earn reviews and become a trusted name in your niche.' },
  { icon: TrendingUp, title: 'Monetize your way', description: 'Live sessions, fan support, brand deals and more. All in one place.' },
];

/** Login is Google-only — there's no email/password path anywhere in the
 * product. Returning users (email already registered) go straight to their
 * home/dashboard; a brand-new Google sign-in from here defaults to Fan
 * (role selection lives on /signup for people who want Creator/Brand/Agency). */
export default function Login() {
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const goToRoleHome = (user: { role: string }) => {
    const redirectTo = (location.state as { from?: string } | null)?.from;
    if (redirectTo) navigate(redirectTo);
    else if (user.role === 'creator') navigate('/dashboard/creator');
    else if (user.role === 'brand') navigate('/dashboard/brand');
    else if (user.role === 'agency') navigate('/dashboard/agency');
    else navigate('/');
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user.isNewUser) {
        navigate('/signup');
        return;
      }
      goToRoleHome(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel — same visual language as the Signup wizard's left
       * panel, for a consistent premium feel across the whole auth flow. */}
      <div className="relative hidden overflow-hidden bg-navy-900 px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        {/* Slowly drifting colour glows */}
        <motion.div
          className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-orange-500/20 blur-[110px]"
          animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-pink-500/15 blur-[120px]"
          animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Large floating brand mark watermark, echoing the Signup panel's icon treatment */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 0.05, scale: 1, y: [0, -14, 0] }}
          transition={{ opacity: { duration: 0.6 }, scale: { duration: 0.6 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
          className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2"
        >
          <Sparkles size={340} strokeWidth={1} className="text-white" />
        </motion.div>

        {/* Subtle dot texture for depth, matching Signup */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Link to="/" className="relative mb-10 inline-flex w-fit">
            <Logo className="h-14 w-auto" />
          </Link>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="relative">
            <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
              Welcome back to <span className="brand-gradient-text">Fanitt</span>
            </h1>
            <p className="relative mt-4 max-w-sm text-white/60">
              Log in to book sessions, manage your profile and keep growing your opportunities.
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="relative mt-12 space-y-6">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              className="flex items-start gap-4"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800/70 border border-white/10 text-orange-400">
                <f.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-0.5 text-sm text-white/50">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="relative mt-14 flex items-center gap-3"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50">
            <ShieldCheck size={13} className="text-emerald-400" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50">
            <Zap size={13} className="text-orange-400" /> Trusted by 50K+
          </span>
        </motion.div>
      </div>

      {/* Right panel — Google login */}
      <div className="flex items-center justify-center px-gutter py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-14 w-auto" />
          </Link>

          <h2 className="text-2xl font-bold text-white text-center lg:text-left">Welcome back</h2>
          <p className="mt-1 text-sm text-white/60 text-center lg:text-left">Log in to continue to your Fanitt account.</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle size={16} className="shrink-0" /> {error}
            </motion.div>
          )}

          <motion.button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-navy-800/60 py-3.5 text-base font-semibold text-white shadow-[0_8px_24px_-12px_rgba(249,67,110,0.35)] transition-colors hover:border-orange-400/40 hover:bg-navy-800/90 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
            Continue with Google
          </motion.button>

          <p className="mt-6 text-center text-xs text-white/40 lg:text-left">
            By continuing, you agree to our{' '}
            <a href="#" className="text-orange-400">Terms of Service</a> and{' '}
            <a href="#" className="text-orange-400">Privacy Policy</a>
          </p>

          <p className="mt-6 text-center text-sm text-white/60 lg:text-left">
            New to Fanitt?{' '}
            <Link to="/signup" className="font-semibold text-orange-400 hover:underline">
              Choose your role &amp; sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
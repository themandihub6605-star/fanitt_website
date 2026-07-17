import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, Loader2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { GoogleIcon } from '@/components/GoogleIcon';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/apiClient';

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
        // First time seeing this Google account from the Login page — send
        // them to Signup so they can pick Creator/Brand/Agency if they want;
        // Fan accounts (the default) are already fully set up.
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
      {/* Left brand panel — hidden on mobile */}
      <div className="relative hidden overflow-hidden bg-navy-900 px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/15 blur-[110px]" />

        <Link to="/" className="relative mb-10 inline-flex w-fit">
          <Logo className="h-12 w-auto" />
        </Link>

        <h1 className="relative max-w-md text-4xl font-bold leading-tight text-white">
          Welcome back to <span className="brand-gradient-text">Fanitt</span>
        </h1>
        <p className="relative mt-4 max-w-sm text-white/60">
          Log in to book sessions, manage your profile and keep growing your opportunities.
        </p>

        <div className="relative mt-12 space-y-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800/70 border border-white/10 text-orange-400">
                <f.icon size={20} />
              </span>
              <div>
                <p className="font-semibold text-white">{f.title}</p>
                <p className="mt-0.5 text-sm text-white/50">{f.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative mt-14 flex items-center gap-6 text-xs text-white/40">
          <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> Secure &amp; Encrypted</span>
          <span>Trusted by 50K+ creators &amp; brands</span>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center px-gutter py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex justify-center lg:hidden">
            <Logo className="h-12 w-auto" />
          </Link>

          <h2 className="text-center text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-center text-sm text-white/60">Log in to continue to your Fanitt account.</p>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading}
            className="mt-8 flex w-full items-center justify-center gap-2.5 rounded-xl border border-white/15 bg-navy-800/60 py-3.5 text-base font-semibold text-white hover:border-white/30 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
            Continue with Google
          </button>

          <p className="mt-6 text-center text-xs text-white/40">
            By continuing, you agree to our{' '}
            <a href="#" className="text-orange-400">Terms of Service</a> and{' '}
            <a href="#" className="text-orange-400">Privacy Policy</a>
          </p>

          <p className="mt-6 text-center text-sm text-white/60">
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

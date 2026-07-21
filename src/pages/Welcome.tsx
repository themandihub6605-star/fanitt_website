import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';

/**
 * The screen shown when someone clicks "Get Started" — the REAL Google
 * sign-in happens right here (not on a later page). No role is known yet,
 * so a brand-new account is created as a Fan by default; the next screen
 * (Signup, in "already signed in" mode) asks which role they actually want
 * and upgrades the account via /auth/upgrade-role.
 */
export default function Welcome() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user.isNewUser) {
        // Fresh account, defaulted to Fan — send them into the wizard to
        // pick their real role and fill in the rest.
        navigate('/signup', { state: { viaGoogle: true } });
      } else if (user.role === 'creator') navigate('/dashboard/creator');
      else if (user.role === 'brand') navigate('/dashboard/brand');
      else if (user.role === 'agency') navigate('/dashboard/agency');
      else navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed — please try again');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0A0A0A]">
      {/* Background photo with slow cinematic zoom */}
      <motion.img
        src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1600&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        initial={{ scale: 1.12 }}
        animate={{ scale: 1 }}
        transition={{ duration: 12, ease: 'easeOut' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/60 via-[#0A0A0A]/55 to-[#0A0A0A]" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0A0A0A]/50 via-transparent to-[#0A0A0A]/50 lg:block" />

      {/* Ambient drifting glows for extra depth */}
      <motion.div
        className="pointer-events-none absolute -top-20 left-[-10%] h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]"
        animate={{ x: [0, 30, -10, 0], y: [0, -15, 10, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-[10%] right-[-10%] h-80 w-80 rounded-full bg-pink-500/15 blur-[110px]"
        animate={{ x: [0, -25, 15, 0], y: [0, 15, -10, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-between px-6 py-10 sm:px-10 sm:py-14">
        {/* Logo + tagline */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col items-center text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-full bg-orange-500/20 blur-2xl" />
            <Logo className="h-9 w-auto sm:h-10 lg:h-12" />
          </div>
          <p className="mt-2.5 text-sm font-medium tracking-wide text-white/70 sm:text-base">Live This Life</p>
        </motion.div>

        {/* Glass card holding headline + actions — gives the content real
         * visual weight instead of floating loosely on the photo. Widens
         * and scales up at larger breakpoints instead of staying a small
         * mobile-width card floating in empty space. */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          className="relative w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:max-w-lg sm:p-9 lg:max-w-2xl lg:p-12"
        >
          {/* Flanking feature badges — only at wide desktop widths, so the
           * screen doesn't read as a tiny card lost in empty space. */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="absolute right-full top-1/2 mr-8 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
          >
            {[
              { label: 'Live Sessions', sub: 'Book real creators' },
              { label: 'Escrow Protected', sub: 'Payments held safe' },
            ].map((f) => (
              <div key={f.label} className="w-48 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-sm">
                <p className="text-sm font-bold text-white">{f.label}</p>
                <p className="text-xs text-white/50">{f.sub}</p>
              </div>
            ))}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute left-full top-1/2 ml-8 hidden -translate-y-1/2 flex-col gap-3 xl:flex"
          >
            {[
              { label: '50K+ Creators', sub: 'Already earning' },
              { label: 'Brand Campaigns', sub: 'Collab opportunities' },
            ].map((f) => (
              <div key={f.label} className="w-48 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left backdrop-blur-sm">
                <p className="text-sm font-bold text-white">{f.label}</p>
                <p className="text-xs text-white/50">{f.sub}</p>
              </div>
            ))}
          </motion.div>

          <h1 className="text-[2rem] font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl lg:leading-[1.1]">
            Where Creators
            <br />
            <span className="brand-gradient-text whitespace-nowrap">Live. Connect. Earn.</span>
          </h1>
          <p className="mx-auto mt-3.5 max-w-xs text-sm leading-relaxed text-white/60 sm:max-w-sm sm:text-base lg:max-w-md lg:text-lg">
            Join a community that celebrates talent and turns passion into income.
          </p>

          <div className="mt-6 flex items-center justify-center gap-1.5">
            <motion.span
              className="h-1.5 rounded-full bg-[linear-gradient(90deg,#FF6A1F,#EC2A78)]"
              initial={{ width: 6 }}
              animate={{ width: 22 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            />
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-1.5 text-xs font-semibold text-red-400"
            >
              <AlertCircle size={13} /> {error}
            </motion.p>
          )}

          <div className="mx-auto mt-7 max-w-sm space-y-3 lg:max-w-md">
            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold text-white shadow-[0_10px_30px_-8px_rgba(249,67,110,0.6)] transition-shadow hover:shadow-[0_14px_36px_-6px_rgba(249,67,110,0.75)] disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
            >
              {googleLoading ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
              Continue with Google
              {!googleLoading && <ArrowRight size={18} />}
            </motion.button>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link
                to="/login"
                className="flex w-full items-center justify-center rounded-full border-2 border-white/15 py-3.5 text-base font-semibold text-white/90 backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/[0.04]"
              >
                I already have an account
              </Link>
            </motion.div>
          </div>

          <p className="mx-auto mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-white/35">
            <ShieldCheck size={12} className="text-emerald-400" /> Secure sign-in
          </p>

          <p className="mx-auto mt-3 max-w-sm text-xs text-white/40">
            By continuing, you agree to our{' '}
            <a href="#" className="text-orange-400 hover:underline">Terms of Service</a> and{' '}
            <a href="#" className="text-orange-400 hover:underline">Privacy Policy</a>
          </p>
        </motion.div>

        <div className="h-1" />
      </div>
    </div>
  );
}
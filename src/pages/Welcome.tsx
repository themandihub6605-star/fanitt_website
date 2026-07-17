import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
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
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1600&auto=format&fit=crop"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-[#0A0A0A]/60 to-[#0A0A0A]" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-[#0A0A0A]/40 via-transparent to-[#0A0A0A]/40 lg:block" />

      <div className="relative flex flex-1 flex-col items-center justify-between px-6 py-10 sm:px-10 sm:py-14">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-14 w-auto sm:h-16" />
          <p className="mt-2 text-sm font-medium text-white/70 sm:text-base">Live This Life</p>
        </div>

        <div className="w-full max-w-md text-center sm:max-w-lg">
          <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl">
            Where Creators
            <br />
            <span className="brand-gradient-text">Live. Connect. Earn.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm text-white/60 sm:max-w-sm sm:text-base">
            Join a community that celebrates talent and turns passion into income.
          </p>

          <div className="mt-5 flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-5 rounded-full bg-orange-500" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
            <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          </div>

          {error && (
            <p className="mx-auto mt-4 flex max-w-sm items-center justify-center gap-1.5 text-xs font-semibold text-red-400">
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <div className="mx-auto mt-8 max-w-sm space-y-3">
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              className="flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
            >
              {googleLoading ? <Loader2 size={20} className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
              Continue with Google
              {!googleLoading && <ArrowRight size={18} />}
            </button>
            <Link
              to="/login"
              className="flex w-full items-center justify-center rounded-full border-2 border-white/20 py-3.5 text-base font-semibold text-white hover:border-white/40"
            >
              I already have an account
            </Link>
          </div>

          <p className="mx-auto mt-6 max-w-sm text-xs text-white/40">
            By continuing, you agree to our{' '}
            <a href="#" className="text-orange-400">Terms of Service</a> and{' '}
            <a href="#" className="text-orange-400">Privacy Policy</a>
          </p>
        </div>

        <div className="h-1" />
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/services/apiClient';

const FEATURES = [
  { icon: Sparkles, title: 'Opportunities that match you', description: 'Discover campaigns, gigs and collaborations that fit your talent and goals.' },
  { icon: ShieldCheck, title: 'Build trust & reputation', description: 'Work, earn reviews and become a trusted name in your niche.' },
  { icon: TrendingUp, title: 'Monetize your way', description: 'Live sessions, fan support, brand deals and more. All in one place.' },
];

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      const redirectTo = (location.state as { from?: string } | null)?.from;
      if (redirectTo) navigate(redirectTo);
      else if (user.role === 'creator') navigate('/dashboard/creator');
      else if (user.role === 'brand') navigate('/dashboard/brand');
      else navigate('/');
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel — hidden on mobile, matches reference split-screen auth flow */}
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

      {/* Right form panel */}
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

          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-white/60">Log in to continue to your Fanitt account.</p>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Email Address</span>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-11 pr-4 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-11 pr-11 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-white/60">
                <input type="checkbox" className="rounded border-white/20 bg-white/10" />
                Remember me
              </label>
              <a href="#" className="font-semibold text-orange-400 hover:underline">Forgot password?</a>
            </div>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? <Loader2 size={18} className="animate-spin" /> : 'Log In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Don't have an account?{' '}
            <Link to="/signup" className="font-semibold text-orange-400 hover:underline">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

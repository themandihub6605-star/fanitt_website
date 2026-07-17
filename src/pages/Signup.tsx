import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Phone,
  Sparkles,
  Building2,
  Users2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Instagram,
  Youtube,
  Globe,
  Briefcase,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { getApiErrorMessage } from '@/services/apiClient';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';
import { userApi } from '@/services/userApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/api';

const ROLES = [
  { key: 'fan' as Role, label: 'Fan', icon: User },
  { key: 'creator' as Role, label: 'Creator', icon: Sparkles },
  { key: 'brand' as Role, label: 'Brand', icon: Building2 },
  { key: 'agency' as Role, label: 'Agency', icon: Users2 },
];

export default function Signup() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>('creator');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [wantsUpdates, setWantsUpdates] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  const { register } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'creator' && categories.length === 0) {
      categoryApi.list().then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategory(cats[0]._id);
      });
    }
  }, [role, categories.length]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Step 1 — create the account itself (matches the reference "Create Account" screen)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const user = await register({ name, email, password, role, phone: phone || undefined });
      if (user.role === 'creator' || user.role === 'brand') {
        setStep(2);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — role-specific page setup (matches the reference "Create Your Page" screen)
  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'creator') {
        if (photoFile) {
          const { avatarUrl } = await userApi.uploadAvatar(photoFile);
          dispatch(updateUser({ avatarUrl }));
        }
        await creatorApi.updateMyProfile({
          category: (category || undefined) as any,
          socials: {
            ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
            ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
          },
        });
        navigate('/dashboard/creator');
      } else if (role === 'brand') {
        if (photoFile) {
          await brandApi.uploadLogo(photoFile);
        }
        await brandApi.updateMyProfile({
          companyName: companyName || name,
          website: website || undefined,
          industry: industry || undefined,
        });
        navigate('/dashboard/brand');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const photoLabel = role === 'brand' ? 'Company logo' : 'Profile photo';

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-navy-900 px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-orange-500/20 blur-[100px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-pink-500/15 blur-[110px]" />

        <Link to="/" className="relative mb-10 inline-flex w-fit">
          <Logo className="h-12 w-auto" />
        </Link>

        <div className="relative mb-8 flex items-center gap-2">
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', step >= 1 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50')}>1</span>
          <span className="h-px w-8 bg-white/15" />
          <span className={cn('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold', step >= 2 ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/50')}>2</span>
          <span className="ml-2 text-xs font-semibold text-white/40">{step === 1 ? 'Create Account' : 'Create Your Page'}</span>
        </div>

        <h1 className="relative max-w-md text-4xl font-bold leading-tight text-white">
          {step === 1 ? (
            <>Let's get you started on <span className="brand-gradient-text">Fanitt</span></>
          ) : (
            <>Build your <span className="brand-gradient-text">identity</span></>
          )}
        </h1>
        <p className="relative mt-4 max-w-sm text-white/60">
          {step === 1
            ? 'Create your account to discover opportunities, connect with brands, and grow your journey on Fanitt.'
            : "Tell the world what you do — you can always add more later from your dashboard."}
        </p>

        <div className="relative mt-14 flex items-center gap-6 text-xs text-white/40">
          <span className="flex items-center gap-1.5">Secure &amp; Encrypted</span>
          <span>Trusted by 50K+ creators &amp; brands</span>
        </div>
      </div>

      <div className="flex items-center justify-center px-gutter py-16">
        <Container className="!max-w-lg !px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="rounded-[2rem] border border-white/10 bg-navy-800/60 p-8 shadow-lifted"
          >
            <Link to="/" className="mb-6 flex justify-center lg:hidden">
              <Logo />
            </Link>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-center text-2xl font-bold text-white">Let's get you started!</h1>
                  <p className="mt-1 text-center text-sm text-white/60">Join Fanitt and become a part of our creator community.</p>

                  {/* Role segmented control */}
                  <div className="mt-6 flex rounded-2xl border border-white/10 bg-navy-800/50 p-1">
                    {ROLES.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        className={cn(
                          'flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-all',
                          role === r.key ? 'bg-[linear-gradient(135deg,#7C3AED_0%,#EC2A78_100%)] text-white shadow-card' : 'text-white/50 hover:text-white/80'
                        )}
                      >
                        <r.icon size={15} /> {r.label}
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </div>
                  )}

                  <form className="mt-6 space-y-4" onSubmit={handleCreateAccount}>
                    <label className="block">
                      <div className="relative">
                        <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          required
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <div className="relative">
                        <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email Address"
                          className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-11 pr-4 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <span className="absolute left-11 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/50">+91</span>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="Phone Number"
                          className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-[4.7rem] pr-4 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                        />
                      </div>
                    </label>

                    <label className="block">
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          required
                          minLength={8}
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Password"
                          className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-11 pr-11 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                        />
                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <label className="block">
                      <div className="relative">
                        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                        <input
                          required
                          minLength={8}
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm Password"
                          className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pl-11 pr-11 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70">
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </label>

                    <div className="space-y-2.5 pt-1">
                      <label className="flex items-start gap-2.5 text-xs text-white/60">
                        <input
                          type="checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/10 accent-orange-500"
                        />
                        <span>
                          I agree to the <a href="#" className="text-orange-400 hover:underline">Terms of Service</a> and{' '}
                          <a href="#" className="text-orange-400 hover:underline">Privacy Policy</a>
                        </span>
                      </label>
                      <label className="flex items-start gap-2.5 text-xs text-white/60">
                        <input
                          type="checkbox"
                          checked={wantsUpdates}
                          onChange={(e) => setWantsUpdates(e.target.checked)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-white/10 accent-orange-500"
                        />
                        <span>I want to receive updates and offers from Fanitt</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Create Account <ArrowRight size={18} /></>}
                    </button>
                  </form>

                  <p className="mt-6 text-center text-sm text-white/60">
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-orange-400 hover:underline">
                      Log In
                    </Link>
                  </p>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                  <h1 className="text-center text-2xl font-bold text-white">Create Your {role === 'brand' ? 'Brand' : 'Creator'} Page ✨</h1>
                  <p className="mt-1 text-center text-sm text-white/60">Let's build your identity and tell the world what you do.</p>

                  {error && (
                    <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </div>
                  )}

                  <form className="mt-6 space-y-4" onSubmit={handleFinishSetup}>
                    <div className="flex flex-col items-center gap-2">
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          'group relative flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-dashed border-white/15 bg-navy-800/50 text-white/40 transition-colors hover:border-orange-400/50 hover:text-white/60',
                          role === 'brand' ? 'rounded-2xl' : 'rounded-full'
                        )}
                      >
                        {photoPreview ? (
                          <img src={photoPreview} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Camera size={22} />
                        )}
                        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera size={18} />
                        </span>
                      </button>
                      <span className="text-xs font-semibold text-white/60">{photoLabel} (optional)</span>
                    </div>

                    {role === 'creator' && (
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400"
                          >
                            {categories.map((c) => (
                              <option key={c._id} value={c._id} className="bg-[#141414]">
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">Instagram handle (optional)</span>
                          <div className="relative">
                            <Instagram size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              value={instagram}
                              onChange={(e) => setInstagram(e.target.value)}
                              placeholder="yourhandle"
                              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">YouTube handle (optional)</span>
                          <div className="relative">
                            <Youtube size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              value={youtube}
                              onChange={(e) => setYoutube(e.target.value)}
                              placeholder="yourhandle"
                              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                            />
                          </div>
                        </label>
                      </div>
                    )}

                    {role === 'brand' && (
                      <div className="space-y-4">
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">Company name</span>
                          <div className="relative">
                            <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              required
                              type="text"
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. Glowlab Cosmetics"
                              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">Website (optional)</span>
                          <div className="relative">
                            <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              value={website}
                              onChange={(e) => setWebsite(e.target.value)}
                              placeholder="https://yourbrand.com"
                              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                            />
                          </div>
                        </label>

                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-white/80">Industry (optional)</span>
                          <div className="relative">
                            <Briefcase size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                            <input
                              type="text"
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              placeholder="e.g. Beauty & Personal Care"
                              className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                            />
                          </div>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Finish Setup <ArrowRight size={18} /></>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Container>
      </div>
    </div>
  );
}

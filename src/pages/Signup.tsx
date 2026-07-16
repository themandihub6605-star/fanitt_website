import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  Sparkles,
  Building2,
  Check,
  AlertCircle,
  Loader2,
  Instagram,
  Youtube,
  Globe,
  Briefcase,
  Camera,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
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
  { key: 'fan' as Role, label: 'Fan', description: 'Discover creators & book sessions', icon: User },
  { key: 'creator' as Role, label: 'Creator', description: 'Build a page & earn from your following', icon: Sparkles },
  { key: 'brand' as Role, label: 'Brand', description: 'Find creators & launch campaigns', icon: Building2 },
];

export default function Signup() {
  const [role, setRole] = useState<Role>('fan');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ name, email, password, role });

      if (user.role === 'creator') {
        if (photoFile) {
          const { avatarUrl } = await userApi.uploadAvatar(photoFile);
          dispatch(updateUser({ avatarUrl }));
        }
        await creatorApi.updateMyProfile({
          category: category || undefined,
          socials: {
            ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
            ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
          },
        });
        navigate('/dashboard/creator');
      } else if (user.role === 'brand') {
        if (photoFile) {
          await brandApi.uploadLogo(photoFile);
        }
        await brandApi.updateMyProfile({
          companyName: companyName || name,
          website: website || undefined,
          industry: industry || undefined,
        });
        navigate('/dashboard/brand');
      } else {
        if (photoFile) {
          const { avatarUrl } = await userApi.uploadAvatar(photoFile);
          dispatch(updateUser({ avatarUrl }));
        }
        navigate('/');
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const photoLabel = role === 'brand' ? 'Company logo' : 'Profile photo';

  return (
    <div className="flex min-h-screen items-center justify-center px-gutter py-24">
      <Container className="!max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-xl shadow-lifted"
        >
          <Link to="/" className="mb-6 flex justify-center">
            <Logo />
          </Link>

          <h1 className="text-center text-2xl font-bold text-white">Join Fanitt</h1>
          <p className="mt-1 text-center text-sm text-white/60">Tell us who you are — you can always add more later.</p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {ROLES.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRole(r.key)}
                className={cn(
                  'relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors',
                  role === r.key ? 'border-orange-400/60 bg-orange-500/10' : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                )}
              >
                {role === r.key && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Check size={11} />
                  </span>
                )}
                <r.icon size={22} className={role === r.key ? 'text-orange-400' : 'text-white/50'} />
                <span className="text-sm font-bold text-white">{r.label}</span>
                <span className="text-[11px] leading-snug text-white/50">{r.description}</span>
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col items-center gap-2">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'group relative flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-dashed border-white/15 bg-white/[0.03] text-white/40 transition-colors hover:border-orange-400/50 hover:text-white/60',
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

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Full name</span>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Email</span>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Password</span>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>
            </label>

            <AnimatePresence mode="wait">
              {role === 'creator' && (
                <motion.div
                  key="creator-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden border-t border-white/10 pt-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-300">Creator details</p>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-white focus:border-orange-400"
                    >
                      {categories.map((c) => (
                        <option key={c._id} value={c._id} className="bg-[#0d1120]">
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
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
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
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                      />
                    </div>
                  </label>
                </motion.div>
              )}

              {role === 'brand' && (
                <motion.div
                  key="brand-fields"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden border-t border-white/10 pt-4"
                >
                  <p className="text-xs font-bold uppercase tracking-wide text-orange-300">Brand details</p>

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
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
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
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
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
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                      />
                    </div>
                  </label>
                </motion.div>
              )}
            </AnimatePresence>

            <Button type="submit" disabled={loading} className="w-full justify-center">
              {loading ? <Loader2 size={18} className="animate-spin" /> : `Create ${ROLES.find((r) => r.key === role)?.label} Account`}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-orange-400 hover:underline">
              Log in
            </Link>
          </p>
        </motion.div>
      </Container>
    </div>
  );
}
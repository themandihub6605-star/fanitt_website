import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Sparkles,
  Building2,
  Users2,
  AlertCircle,
  Loader2,
  Instagram,
  Youtube,
  Globe,
  Camera,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Clock,
  Languages as LanguagesIcon,
  Tag,
  Calendar,
  FileText,
  CheckCircle2,
  Briefcase,
  Link2,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Logo } from '@/components/Logo';
import { useAuth } from '@/hooks/useAuth';
import { updateUser } from '@/store/slices/authSlice';
import { getApiErrorMessage } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { creatorApi } from '@/services/creatorApi';
import { brandApi } from '@/services/brandApi';
import { agencyApi } from '@/services/agencyApi';
import { userApi } from '@/services/userApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { cn } from '@/utils/cn';
import type { Role } from '@/types/api';

const ROLES = [
  { key: 'fan' as Role, label: 'Fan', icon: User, tagline: 'Follow creators, join live sessions, support who you love.' },
  { key: 'creator' as Role, label: 'Creator', icon: Sparkles, tagline: 'Turn your content and skills into income.' },
  { key: 'brand' as Role, label: 'Brand', icon: Building2, tagline: 'Find creators and run campaigns, escrow-protected.' },
  { key: 'agency' as Role, label: 'Agency', icon: Users2, tagline: 'Refer creators & brands, earn commission.' },
];
const ROLE_CONTENT: Record<Role, { headline: string; highlight: string; subtext: string; glow: [string, string] }> = {
  fan: {
    headline: 'Discover, connect and',
    highlight: 'be inspired',
    subtext: 'Follow your favourite creators, join live sessions and support the people you love watching.',
    glow: ['#F9436E', '#7C3AED'],
  },
  creator: {
    headline: "Let's get you started on",
    highlight: 'Fanitt',
    subtext: 'Discover opportunities, connect with brands, and grow your journey on Fanitt.',
    glow: ['#FF6A1F', '#EC2A78'],
  },
  brand: {
    headline: 'Find creators who',
    highlight: 'get your brand',
    subtext: 'Post opportunities, discover verified creators and run campaigns backed by escrow-protected payments.',
    glow: ['#0EA5E9', '#7C3AED'],
  },
  agency: {
    headline: 'Scale your',
    highlight: 'creator network',
    subtext: 'Manage rosters, refer creators and earn commission as part of the Fanitt Agency Network.',
    glow: ['#F9436E', '#FFB020'],
  },
  admin: {
    headline: 'Manage the',
    highlight: 'Fanitt platform',
    subtext: 'Oversee creators, brands, agencies and campaigns from one place.',
    glow: ['#7C3AED', '#0EA5E9'],
  },
};
// 5-step sequence: role -> personal -> work (skipped for Fan) -> social -> review.
function getSlides(role: Role): string[] {
  const slides = ['role', 'personal'];
  if (role !== 'fan') slides.push('work');
  slides.push('social', 'review');
  return slides;
}

const SLIDE_LABELS: Record<string, string> = {
  role: 'Choose Role',
  personal: 'Personal Info',
  work: 'Work Details',
  social: 'Social Media',
  review: 'Review',
};

export default function Signup() {
  const [role, setRole] = useState<Role>('creator');
  const [slideIndex, setSlideIndex] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // From Google
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // Personal info (not provided by Google)
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState(''); // real photo Google already gave us, if any
  const [documentFile, setDocumentFile] = useState<File | null>(null);

  // Creator work details
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('English, Hindi');
  const [responseTime, setResponseTime] = useState('Within a few hours');
  const [yearsOfExperience, setYearsOfExperience] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [isAvailableForWork, setIsAvailableForWork] = useState(true);

  // Brand work details
  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  const [industry, setIndustry] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [whatWeOffer, setWhatWeOffer] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');

  // Agency work details
  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [agencyState, setAgencyState] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Social
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [behance, setBehance] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  const { loginWithGoogle } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const currentUser = useAppSelector((s) => s.auth.user);

  // True when we arrived here already signed in via Google from the
  // Get Started page — the role slide then upgrades the (Fan-by-default)
  // account instead of triggering a second Google sign-in.
  const viaGoogle = Boolean((routerLocation.state as { viaGoogle?: boolean } | null)?.viaGoogle);

  useEffect(() => {
    if (viaGoogle && currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
      setGoogleAvatarUrl(currentUser.avatarUrl || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slides = useMemo(() => getSlides(role), [role]);
  const currentSlide = slides[slideIndex];
  const totalSteps = slides.length;

  useEffect(() => {
    if (role === 'creator' && categories.length === 0) {
      categoryApi.list().then((cats) => {
        setCategories(cats);
        if (cats.length > 0) setCategory(cats[0]._id);
      });
    }
  }, [role, categories.length]);

  const goNext = () => setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
  const goBack = () => setSlideIndex((i) => Math.max(i - 1, 0));

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setError('');
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setDocumentFile(file);
  };

  // ---- Slide: role — this is where the ONLY sign-in action lives ----
  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(role);
      if (user.isNewUser) {
        setName(user.name);
        setEmail(user.email);
        setGoogleAvatarUrl(user.avatarUrl || '');
        if (user.role === 'fan') {
          // Fan has nothing else to fill beyond optional personal info —
          // still walk them through the (short) wizard so they can add a
          // photo/phone if they want, rather than dropping them mid-flow.
          goNext();
        } else {
          goNext();
        }
      } else {
        // Returning account — straight to wherever they already belong.
        if (user.role === 'creator') navigate('/dashboard/creator');
        else if (user.role === 'brand') navigate('/dashboard/brand');
        else if (user.role === 'agency') navigate('/dashboard/agency');
        else navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  /** viaGoogle path: already signed in (as Fan by default) from Get Started.
   * Picking a role here upgrades the existing account instead of running
   * Google sign-in a second time. */
  const handleRoleContinue = async () => {
    setError('');
    if (role === 'fan') {
      // Already a Fan by default — nothing to upgrade, just continue.
      goNext();
      return;
    }
    setLoading(true);
    try {
      const updated = await authApi.upgradeRole({ role, name });
      dispatch(updateUser({ role: updated.role, roles: updated.roles }));
      goNext();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ---- Final submit ----
  // Every optional detail call below is wrapped so a single failure (bad
  // network, one bad field) can't strand the person on this screen forever —
  // the account itself was already created back on the Google step, so we
  // always end by navigating to the right home/dashboard. Any failure is
  // still shown as a soft warning so the person knows to revisit Edit Profile.
  const handleFinish = async () => {
    setError('');
    setLoading(true);
    const softErrors: string[] = [];

    const safeCall = async (label: string, fn: () => Promise<unknown>) => {
      try {
        await fn();
      } catch (err) {
        softErrors.push(`${label}: ${getApiErrorMessage(err)}`);
      }
    };

    if (phone) {
      await safeCall('Phone', () => userApi.updateMe({ phone }));
    }

    // Only upload a new photo if the person actually picked one — if Google
    // already gave us a photo and they didn't change it, there's nothing to
    // re-upload (it's already saved on the account from the Google step).
    if (photoFile) {
      if (role === 'brand') {
        await safeCall('Logo', () => brandApi.uploadLogo(photoFile));
      } else {
        await safeCall('Photo', async () => {
          const { avatarUrl } = await userApi.uploadAvatar(photoFile);
          dispatch(updateUser({ avatarUrl }));
        });
      }
    }

    if (role === 'creator') {
      await safeCall('Creator profile', () =>
        creatorApi.updateMyProfile({
          title,
          bio,
          category: (category || undefined) as any,
          location,
          isAvailableForWork,
          responseTime,
          languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
          skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
          yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : undefined,
          portfolioLink: portfolioLink || undefined,
          socials: {
            ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
            ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
            ...(behance && { behance: behance.startsWith('http') ? behance : `https://behance.net/${behance}` }),
            ...(website && { website: website.startsWith('http') ? website : `https://${website}` }),
          },
        })
      );
      setLoading(false);
      navigate('/dashboard/creator');
    } else if (role === 'brand') {
      await safeCall('Brand profile', () =>
        brandApi.updateMyProfile({
          companyName: companyName || name,
          tagline: tagline || undefined,
          about: about || undefined,
          website: website || undefined,
          industry: industry || undefined,
          location: location || undefined,
          foundedYear: foundedYear ? Number(foundedYear) : undefined,
          companySize: companySize || undefined,
          whatWeOffer: whatWeOffer.split(',').map((s) => s.trim()).filter(Boolean),
          targetAudience: targetAudience || undefined,
          contactDesignation: contactDesignation || undefined,
          socials: {
            ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
            ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
            ...(linkedin && { linkedin: linkedin.startsWith('http') ? linkedin : `https://linkedin.com/company/${linkedin}` }),
          },
        })
      );
      setLoading(false);
      navigate('/dashboard/brand');
    } else if (role === 'agency') {
      if (documentFile) await safeCall('Document', () => agencyApi.uploadDocument(documentFile));
      await safeCall('Agency profile', () =>
        agencyApi.updateMyProfile({
          agencyName: companyName || name,
          ownerName: ownerName || name,
          mobile: phone || undefined,
          city: city || undefined,
          state: agencyState || undefined,
          gstNumber: gstNumber || undefined,
          teamSize: teamSize || undefined,
          yearsInBusiness: yearsInBusiness ? Number(yearsInBusiness) : undefined,
          specialization: specialization || undefined,
          submitForApproval: true,
        })
      );
      setLoading(false);
      navigate('/dashboard/agency');
    } else {
      setLoading(false);
      navigate('/');
    }

    if (softErrors.length > 0) {
      console.warn('[signup] Some profile details did not save — you can fix these from Edit Profile:', softErrors);
    }
  };

  const photoLabel = role === 'brand' || role === 'agency' ? 'Company logo' : 'Profile photo';

  const slideTitles: Record<string, string> = {
    role: "Who's joining Fanitt?",
    personal: 'A few personal details',
    work: role === 'creator' ? 'Tell us about your work' : role === 'brand' ? 'About your brand' : 'Agency details',
    social: role === 'fan' ? 'Add a profile photo' : 'Photo & social links',
    review: 'Review & finish',
  };

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden overflow-hidden bg-navy-900 px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute inset-0">
            <div className="absolute -left-20 top-[-15%] h-[26rem] w-[26rem] rounded-full blur-[120px]" style={{ background: ROLE_CONTENT[role].glow[0], opacity: 0.28 }} />
            <div className="absolute -right-16 bottom-[-10%] h-[24rem] w-[24rem] rounded-full blur-[130px]" style={{ background: ROLE_CONTENT[role].glow[1], opacity: 0.22 }} />
          </motion.div>
        </AnimatePresence>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <Link to="/" className="relative mb-10 inline-flex w-fit">
          <Logo className="h-12 w-auto" />
        </Link>

        <div className="relative mb-3 flex items-center gap-1.5">
          {slides.map((s, i) => (
            <span key={s} className={cn('h-1.5 rounded-full transition-all', i === slideIndex ? 'w-8 bg-orange-500' : i < slideIndex ? 'w-4 bg-orange-500/50' : 'w-4 bg-white/15')} />
          ))}
        </div>
        <p className="relative mb-8 text-xs font-semibold text-white/40">
          Step {slideIndex + 1} of {totalSteps} &middot; {SLIDE_LABELS[currentSlide]}
        </p>

        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="relative">
            <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
              {ROLE_CONTENT[role].headline} <span className="brand-gradient-text">{ROLE_CONTENT[role].highlight}</span>
            </h1>
            <p className="mt-4 max-w-sm text-white/60">{ROLE_CONTENT[role].subtext}</p>
          </motion.div>
        </AnimatePresence>

        <div className="relative mt-14 flex items-center gap-6 text-xs text-white/40">
          <span>Secure &amp; Encrypted</span>
          <span>Trusted by 50K+ creators &amp; brands</span>
        </div>
      </div>

      {/* Right wizard panel */}
      <div className="flex items-center justify-center px-gutter py-16">
        <Container className="!max-w-lg !px-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-[2rem] border border-white/10 bg-navy-800/60 p-8 shadow-lifted">
            <Link to="/" className="mb-6 flex justify-center lg:hidden">
              <Logo />
            </Link>

            <div className="mb-6 flex items-center gap-1.5 lg:hidden">
              {slides.map((s, i) => (
                <span key={s} className={cn('h-1.5 flex-1 rounded-full', i <= slideIndex ? 'bg-orange-500' : 'bg-white/10')} />
              ))}
            </div>

            <h1 className="text-center text-2xl font-bold text-white">{slideTitles[currentSlide]}</h1>

            {error && (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* SLIDE 1: ROLE (+ GOOGLE, unless we're already signed in via Get Started) */}
              {currentSlide === 'role' && (
                <motion.div key="role" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                  <p className="mt-1 text-center text-sm text-white/60">
                    {viaGoogle ? `Signed in as ${name || email} — pick the option that fits you.` : 'Pick the option that fits you, then continue with Google.'}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {ROLES.map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        className={cn(
                          'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all',
                          role === r.key ? 'border-orange-400/60 bg-orange-500/10' : 'border-white/10 bg-navy-800/50 hover:border-white/20'
                        )}
                      >
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', role === r.key ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60')}>
                          <r.icon size={17} />
                        </span>
                        <span className="text-sm font-bold text-white">{r.label}</span>
                        <span className="text-[11px] leading-snug text-white/40">{r.tagline}</span>
                      </button>
                    ))}
                  </div>

                  {viaGoogle ? (
                    <button
                      type="button"
                      onClick={handleRoleContinue}
                      disabled={loading}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continue as {ROLES.find((r) => r.key === role)?.label} <ArrowRight size={18} /></>}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
                      >
                        {googleLoading ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
                        Continue with Google as {ROLES.find((r) => r.key === role)?.label}
                      </button>

                      <p className="mt-6 text-center text-sm text-white/60">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-orange-400 hover:underline">Log In</Link>
                      </p>
                    </>
                  )}
                </motion.div>
              )}

              {/* SLIDE 2: PERSONAL INFO */}
              {currentSlide === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><CheckCircle2 size={16} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{name}</p>
                      <p className="truncate text-xs text-white/50">{email}</p>
                    </div>
                  </div>

                  <TextField icon={Phone} value={phone} onChange={setPhone} placeholder="Phone number" />
                  <TextField icon={MapPin} value={location} onChange={setLocation} placeholder="Location (city, country)" />

                  <StepNav onBack={goBack} onNext={goNext} loading={loading} />
                </motion.div>
              )}

              {/* SLIDE 3: WORK DETAILS (role-specific, skipped for Fan) */}
              {currentSlide === 'work' && (
                <motion.div key="work" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-4">
                  {role === 'creator' && (
                    <>
                      <TextField value={title} onChange={setTitle} placeholder="Title / Tagline (e.g. Photographer & Filmmaker)" />
                      <label className="block">
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Short bio" rows={3} maxLength={500} className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-400" />
                      </label>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400">
                          {categories.map((c) => <option key={c._id} value={c._id} className="bg-[#141414]">{c.label}</option>)}
                        </select>
                      </label>
                      <TextField icon={Tag} value={skills} onChange={setSkills} placeholder="Skills, comma separated" />
                      <TextField icon={LanguagesIcon} value={languages} onChange={setLanguages} placeholder="Languages" />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField icon={Clock} value={responseTime} onChange={setResponseTime} placeholder="Response time" />
                        <TextField icon={Briefcase} value={yearsOfExperience} onChange={setYearsOfExperience} placeholder="Years experience" type="number" />
                      </div>
                      <TextField icon={Link2} value={portfolioLink} onChange={setPortfolioLink} placeholder="Portfolio link (optional)" />
                      <label className="flex items-center justify-between rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3.5">
                        <span className="text-sm font-semibold text-white/80">Available for work</span>
                        <button type="button" onClick={() => setIsAvailableForWork((v) => !v)} className={cn('relative h-6 w-11 rounded-full transition-colors', isAvailableForWork ? 'bg-emerald-500' : 'bg-white/15')}>
                          <span className={cn('absolute top-1 h-4 w-4 rounded-full bg-white transition-transform', isAvailableForWork ? 'translate-x-6' : 'translate-x-1')} />
                        </button>
                      </label>
                    </>
                  )}

                  {role === 'brand' && (
                    <>
                      <TextField icon={Building2} value={companyName} onChange={setCompanyName} placeholder="Company name" required />
                      <TextField value={tagline} onChange={setTagline} placeholder="Tagline" />
                      <label className="block">
                        <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="About your brand" rows={3} maxLength={500} className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-400" />
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField value={industry} onChange={setIndustry} placeholder="Industry" />
                        <TextField icon={Calendar} value={foundedYear} onChange={setFoundedYear} placeholder="Founded year" type="number" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <TextField icon={Users2} value={companySize} onChange={setCompanySize} placeholder="Company size" />
                        <TextField value={contactDesignation} onChange={setContactDesignation} placeholder="Your designation" />
                      </div>
                      <TextField icon={Tag} value={whatWeOffer} onChange={setWhatWeOffer} placeholder="What you offer, comma separated" />
                      <TextField value={targetAudience} onChange={setTargetAudience} placeholder="Target audience (e.g. Women 18-30)" />
                    </>
                  )}

                  {role === 'agency' && (
                    <>
                      <TextField icon={Building2} value={companyName} onChange={setCompanyName} placeholder="Agency name" required />
                      <TextField icon={User} value={ownerName} onChange={setOwnerName} placeholder={name || 'Owner name'} />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField icon={MapPin} value={city} onChange={setCity} placeholder="City" />
                        <TextField value={agencyState} onChange={setAgencyState} placeholder="State" />
                      </div>
                      <TextField icon={FileText} value={gstNumber} onChange={setGstNumber} placeholder="GST number (optional)" />
                      <div className="grid grid-cols-2 gap-3">
                        <TextField icon={Users2} value={teamSize} onChange={setTeamSize} placeholder="Team size (e.g. 1-10)" />
                        <TextField icon={Calendar} value={yearsInBusiness} onChange={setYearsInBusiness} placeholder="Years in business" type="number" />
                      </div>
                      <TextField value={specialization} onChange={setSpecialization} placeholder="Specialization (e.g. Fashion creators)" />
                      <p className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-white/50">
                        Your agency needs admin approval before the dashboard unlocks.
                      </p>
                    </>
                  )}

                  <StepNav onBack={goBack} onNext={goNext} loading={loading} />
                </motion.div>
              )}

              {/* SLIDE 4: SOCIAL + PHOTO */}
              {currentSlide === 'social' && (
                <motion.div key="social" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-4">
                  <div className="flex flex-col items-center gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        'group relative flex h-24 w-24 items-center justify-center overflow-hidden border-2 border-dashed border-white/15 bg-navy-800/50 text-white/40 transition-colors hover:border-orange-400/50',
                        role === 'brand' || role === 'agency' ? 'rounded-2xl' : 'rounded-full'
                      )}
                    >
                      {photoPreview || googleAvatarUrl ? (
                        <img src={photoPreview || googleAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Camera size={22} />
                      )}
                    </button>
                    <span className="text-xs font-semibold text-white/60">
                      {googleAvatarUrl && !photoFile
                        ? `Using your Google photo — tap to change`
                        : `${photoLabel} (optional${role === 'creator' || role === 'fan' ? ' — most Google accounts don\u2019t have one' : ''})`}
                    </span>
                  </div>

                  {(role === 'creator' || role === 'brand') && (
                    <>
                      <TextField icon={Instagram} value={instagram} onChange={setInstagram} placeholder="Instagram handle" />
                      <TextField icon={Youtube} value={youtube} onChange={setYoutube} placeholder="YouTube handle" />
                      {role === 'creator' && <TextField value={behance} onChange={setBehance} placeholder="Behance username" />}
                      {role === 'brand' && <TextField value={linkedin} onChange={setLinkedin} placeholder="LinkedIn company page" />}
                      <TextField icon={Globe} value={website} onChange={setWebsite} placeholder="Website" />
                    </>
                  )}

                  {role === 'agency' && (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-white/80">ID / Address proof (optional)</span>
                      <input type="file" accept="image/*" onChange={handleDocumentSelect} className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange-300" />
                    </label>
                  )}

                  <StepNav onBack={goBack} onNext={goNext} loading={loading} />
                </motion.div>
              )}

              {/* SLIDE 5: REVIEW */}
              {currentSlide === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6">
                  <div className="flex flex-col items-center text-center">
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                      <CheckCircle2 size={26} />
                    </span>
                    <p className="mt-4 text-sm text-white/60">
                      You're all set as a <b className="text-white capitalize">{role}</b>
                      {name && <> — welcome, <b className="text-white">{name}</b>!</>}
                    </p>
                    {role === 'agency' && (
                      <p className="mt-2 text-xs text-white/40">Your agency will need admin approval before the full dashboard unlocks.</p>
                    )}
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={goBack} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Finish &amp; Go to Dashboard <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Container>
      </div>
    </div>
  );
}

// ---- Shared small field components ----
function TextField({
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
}: {
  icon?: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
function StepNav({ onBack, onNext, loading }: { onBack: () => void; onNext: () => void; loading: boolean }) {
  return (
    <div className="flex gap-3 pt-1">
      <button type="button" onClick={onBack} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 hover:border-white/30">
        <ArrowLeft size={15} /> Back
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
      >
        Continue <ArrowRight size={18} />
      </button>
    </div>
  );
}
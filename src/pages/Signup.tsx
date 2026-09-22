import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  Mail,
  Sparkles,
  Building2,
  Users2,
  AlertCircle,
  Loader2,
  Instagram,
  Facebook,
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
  ChevronDown,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { GoogleIcon } from '@/components/GoogleIcon';
import { Logo } from '@/components/Logo';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
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

type SignupRole = 'fan' | 'creator' | 'brand' | 'agency';

const ROLES = [
  // { key: 'fan' as SignupRole, label: 'Fan', icon: User, tagline: 'Follow creators, join live sessions, support who you love.' },
  { key: 'creator' as SignupRole, label: 'Creator', icon: Sparkles, tagline: 'Turn your content and skills into income.' },
  { key: 'brand' as SignupRole, label: 'Brand', icon: Building2, tagline: 'Find creators and run campaigns, escrow-protected.' },
  { key: 'agency' as SignupRole, label: 'Agency', icon: Users2, tagline: 'Refer creators & brands, earn commission.' },
];

const ROLE_CONTENT: Record<SignupRole, { headline: string; highlight: string; subtext: string; glow: [string, string] }> = {
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
};

const ROLE_IMAGES: Record<SignupRole, string> = {
  fan: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?q=80&w=1200&auto=format&fit=crop',
  creator: 'https://images.unsplash.com/photo-1630797160666-38e8c5ba44c1?q=80&w=1200&auto=format&fit=crop',
  brand: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop',
  agency: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?q=80&w=1200&auto=format&fit=crop',
};

const INDUSTRIES = [
  'Beauty & Personal Care',
  'Fashion & Apparel',
  'Food & Beverage',
  'Health & Fitness',
  'Technology & Software',
  'Finance & FinTech',
  'Travel & Hospitality',
  'Education & E-learning',
  'Gaming & Entertainment',
  'Home & Lifestyle',
  'Automotive',
  'Retail & E-commerce',
  'Other',
];

const COMPANY_SIZES = ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'];

// --- Social profile URL validation -----------------------------------------
// Users now paste a full profile URL instead of just a handle. Each pattern
// accepts with/without protocol and with/without "www.", and is used both to
// show a live green tick on the field and to gate the "required" checks.
const SOCIAL_URL_PATTERNS: Record<'instagram' | 'youtube' | 'facebook' | 'linkedin' | 'website', RegExp> = {
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?(\?.*)?$/i,
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|@)?[\w.-]+|youtu\.be\/[\w.-]+)\/?(\?.*)?$/i,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[\w.]{1,50}\/?(\?.*)?$/i,
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/(company|in)\/[\w-]{1,100}\/?(\?.*)?$/i,
  website: /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}([/?#].*)?$/i,
};

const isValidSocialUrl = (platform: keyof typeof SOCIAL_URL_PATTERNS, value: string) =>
  SOCIAL_URL_PATTERNS[platform].test(value.trim());

const normalizeUrl = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

function getSlides(role: SignupRole): string[] {
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

// Icon shown in the small badge above each step's title in the mobile header.
// The 'role' step uses the currently selected role's own icon instead (see
// usage) so it reacts live as the person picks Creator / Brand / Agency.
const STEP_ICONS: Record<string, LucideIcon> = {
  personal: User,
  work: Briefcase,
  social: Camera,
  review: CheckCircle2,
};

const APPROVAL_GATED_ROLES: SignupRole[] = ['creator', 'brand', 'agency'];

const KNOWN_SIGNUP_ROLES: SignupRole[] = ['fan', 'creator', 'brand', 'agency'];

export default function Signup() {
  const [role, setRole] = useState<SignupRole>('creator');
  const [slideIndex, setSlideIndex] = useState(0);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState('');
  const [documentFile, setDocumentFile] = useState<File | null>(null);

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

  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  const [industry, setIndustry] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [whatWeOffer, setWhatWeOffer] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');

  const [ownerName, setOwnerName] = useState('');
  const [city, setCity] = useState('');
  const [agencyState, setAgencyState] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [yearsInBusiness, setYearsInBusiness] = useState('');
  const [specialization, setSpecialization] = useState('');

  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [facebook, setFacebook] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  const { loginWithGoogle } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const currentUser = useAppSelector((s) => s.auth.user);

  // True right after the Google-button flow (router state) OR when the
  // person is already authenticated with an incomplete profile and lands
  // here directly — closed the tab mid-signup, refreshed, typed the URL
  // again, came back next day, etc. Router state is only present for the
  // single navigation that set it, so on a fresh page load it's gone even
  // though the person is still logged in — currentUser.onboardingCompleted
  // is the real, persistent source of truth for "mid Google signup".
  const viaGoogleState = Boolean((routerLocation.state as { viaGoogle?: boolean } | null)?.viaGoogle);
  const hasIncompleteGoogleSession = Boolean(currentUser && !currentUser.onboardingCompleted);
  const viaGoogle = viaGoogleState || hasIncompleteGoogleSession;

  // currentUser is frequently still null on first render (auth restore from
  // the session/cookie resolves asynchronously after mount), so this can't
  // be a mount-only effect — it has to react whenever currentUser actually
  // becomes available. The ref stops it from re-firing and stomping on
  // fields the person has since edited.
  const prefilledFromGoogleRef = useRef(false);
  useEffect(() => {
    if (!currentUser || prefilledFromGoogleRef.current) return;
    if (!viaGoogleState && !hasIncompleteGoogleSession) return;

    prefilledFromGoogleRef.current = true;
    setName(currentUser.name);
    setEmail(currentUser.email);
    setGoogleAvatarUrl(currentUser.avatarUrl || '');

    if (hasIncompleteGoogleSession) {
      // A returning, incomplete profile may already have a role assigned
      // server-side — pre-select it instead of defaulting to 'creator' so
      // the right work-details fields show up, but stay on the Role step:
      // the person can still see it and change their mind before
      // continuing (previously this also auto-advanced past the step,
      // which hid the picker entirely for anyone with an existing
      // session — reverted).
      const savedRole = currentUser.role as SignupRole;
      if (KNOWN_SIGNUP_ROLES.includes(savedRole)) {
        setRole(savedRole);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, viaGoogleState, hasIncompleteGoogleSession]);

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

  // Validates the current step before letting the person move on — every
  // field on 'personal' and 'work' is now mandatory, so an empty field
  // blocks Continue with a specific message instead of silently advancing.
  const handleStepNext = () => {
    setError('');

    if (currentSlide === 'personal') {
      if (!name.trim()) return setError('Full name is required');
      if (!phone.trim() || phone.trim().length < 10) return setError('A valid 10-digit phone number is required');
      if (!location.trim()) return setError('Location is required');
    }

    if (currentSlide === 'work') {
      if (role === 'creator') {
        if (!title.trim()) return setError('Title / Tagline is required');
        if (!bio.trim()) return setError('Bio is required');
        if (!category) return setError('Please select a category');
        if (!skills.trim()) return setError('Skills are required');
        if (!languages.trim()) return setError('Languages are required');
        if (!responseTime.trim()) return setError('Response time is required');
        if (!yearsOfExperience.trim()) return setError('Years of experience is required');
      }
      if (role === 'brand') {
        if (!companyName.trim()) return setError('Company name is required');
        if (!tagline.trim()) return setError('Tagline is required');
        if (!about.trim()) return setError('About your brand is required');
        if (!industry) return setError('Please select an industry');
        if (!foundedYear.trim()) return setError('Founded year is required');
        if (!companySize) return setError('Please select a company size');
        if (!contactDesignation.trim()) return setError('Your designation is required');
        if (!whatWeOffer.trim()) return setError('What you offer is required');
        if (!targetAudience.trim()) return setError('Target audience is required');
      }
      if (role === 'agency') {
        if (!companyName.trim()) return setError('Agency name is required');
        if (!ownerName.trim()) return setError('Contact person is required');
        if (!city.trim()) return setError('City is required');
        if (!agencyState.trim()) return setError('State is required');
        if (!gstNumber.trim()) return setError('GST number is required');
        if (!teamSize.trim()) return setError('Team size is required');
        if (!yearsInBusiness.trim()) return setError('Years in business is required');
        if (!specialization.trim()) return setError('Specialization is required');
      }
    }

    goNext();
  };

  // Same idea for the 'social' step — photo, and (for creator/brand)
  // Instagram, are now mandatory, so this step gets its own Continue handler.
  const handleSocialNext = () => {
    setError('');
    if (!photoFile) return setError(`Please upload a ${photoLabel.toLowerCase()} — it's required to create an account`);

    if (role === 'creator' || role === 'brand') {
      if (!instagram.trim()) return setError('Instagram profile URL is required');
      if (!isValidSocialUrl('instagram', instagram)) return setError('Please enter a valid Instagram profile URL');
    }

    if (role === 'agency' && !documentFile) return setError('ID / Address proof is required');

    goNext();
  };

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

  const homeForReturningUser = (u: { role: string; profileStatus?: string | null; onboardingCompleted?: boolean }) => {
    // Anyone — regardless of role — who hasn't finished the multi-step
    // signup form yet must be sent back into it, never into a dashboard or
    // even the pending-approval screen. Previously this check only applied
    // to the 'fan' role, so a Creator/Brand/Agency user who authenticated
    // with Google, got a role assigned, then left before finishing the
    // form (or hitting "Finish") would fall through the checks below and
    // land straight on their dashboard on their next visit — unapproved
    // and with an incomplete profile.
    if (!u.onboardingCompleted) {
      return '/signup';
    }
    // Once onboarding is complete, an approval-gated role must be
    // explicitly 'verified' to reach its dashboard. Any other value —
    // including a missing/empty status — sends them to pending-approval
    // instead of silently falling through to the dashboard link below.
    if (APPROVAL_GATED_ROLES.includes(u.role as SignupRole) && u.profileStatus !== 'verified') {
      return '/pending-approval';
    }
    if (u.role === 'creator') return '/dashboard/creator';
    if (u.role === 'brand') return '/dashboard/brand';
    if (u.role === 'agency') return '/dashboard/agency';
    return '/';
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle(role, referralCode || undefined);
      if (user.isNewUser) {
        setName(user.name);
        setEmail(user.email);
        setGoogleAvatarUrl(user.avatarUrl || '');
        prefilledFromGoogleRef.current = true;
        goNext();
      } else {
        const dest = homeForReturningUser(user);
        if (dest === '/signup') {
          setName(user.name);
          setEmail(user.email);
          setGoogleAvatarUrl(user.avatarUrl || '');
          prefilledFromGoogleRef.current = true;
          goNext();
        } else {
          navigate(dest);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : getApiErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRoleContinue = async () => {
    setError('');
    if (role === 'fan') {
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

  const goToPendingWithSuccess = (displayName?: string) => {
    setLoading(false);
    setShowSuccess(true);
    setTimeout(() => navigate('/pending-approval', { state: { displayName } }), 1600);
  };

  const finishFanOnboarding = () => {
    setLoading(false);
    navigate('/');
  };

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

    if (name.trim() || phone) {
      await safeCall('Profile', () => userApi.updateMe({ name: name.trim() || undefined, phone: phone || undefined }));
      dispatch(updateUser({ name: name.trim() || currentUser?.name || name }));
    }

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

    await safeCall('Onboarding status', () => authApi.completeOnboarding());
    dispatch(updateUser({ onboardingCompleted: true }));

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
            ...(instagram && { instagram: normalizeUrl(instagram) }),
            ...(youtube && { youtube: normalizeUrl(youtube) }),
            ...(facebook && { facebook: normalizeUrl(facebook) }),
            ...(website && { website: normalizeUrl(website) }),
          },
          submitForApproval: true,
        } as any)
      );
      goToPendingWithSuccess();
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
            ...(instagram && { instagram: normalizeUrl(instagram) }),
            ...(youtube && { youtube: normalizeUrl(youtube) }),
            ...(linkedin && { linkedin: normalizeUrl(linkedin) }),
          },
          submitForApproval: true,
        } as any)
      );
      goToPendingWithSuccess();
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
      goToPendingWithSuccess(companyName.trim() || name);
    } else {
      finishFanOnboarding();
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

  // Steps that mix required/optional fields get a small legend under the title.
  const showRequiredLegend = ['personal', 'work', 'social'].includes(currentSlide) && role !== 'fan';

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="relative hidden lg:block">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 flex w-[92%] flex-col justify-center overflow-hidden bg-navy-900 px-14 py-16"
          style={{ borderRadius: '0 42% 42% 0 / 0 50% 50% 0' }}
        >
        <AnimatePresence mode="wait">
          <motion.img
            key={role}
            src={ROLE_IMAGES[role]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 0.8, scale: [1, 1.06, 1], x: [0, -10, 0], y: [0, 8, 0] }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 0.9, ease: 'easeOut' },
              scale: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
              x: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
              y: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/35 via-navy-900/45 to-navy-900/85" />
        <div className="absolute inset-0 bg-gradient-to-r from-navy-900/55 via-navy-900/10 to-navy-900/55" />
        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease: 'easeOut' }} className="absolute inset-0">
            <motion.div
              className="absolute -left-20 top-[-15%] h-[26rem] w-[26rem] rounded-full blur-[120px]"
              style={{ background: ROLE_CONTENT[role].glow[0], opacity: 0.28 }}
              animate={{ x: [0, 30, -10, 0], y: [0, -20, 15, 0] }}
              transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -right-16 bottom-[-10%] h-[24rem] w-[24rem] rounded-full blur-[130px]"
              style={{ background: ROLE_CONTENT[role].glow[1], opacity: 0.22 }}
              animate={{ x: [0, -25, 15, 0], y: [0, 20, -10, 0] }}
              transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
            />
          </motion.div>
        </AnimatePresence>

        {[
          { top: '18%', left: '15%', size: 4, delay: 0 },
          { top: '30%', left: '75%', size: 3, delay: 0.8 },
          { top: '58%', left: '20%', size: 5, delay: 1.4 },
          { top: '70%', left: '65%', size: 3, delay: 0.4 },
          { top: '85%', left: '35%', size: 4, delay: 1.8 },
        ].map((p, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{ top: p.top, left: p.left, width: p.size, height: p.size }}
            animate={{ opacity: [0.15, 0.9, 0.15], y: [0, -18, 0] }}
            transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        <AnimatePresence mode="wait">
          <motion.div
            key={`icon-${role}`}
            initial={{ opacity: 0, scale: 0.85, rotate: -8 }}
            animate={{ opacity: 0.06, scale: 1, rotate: -6, y: [0, -14, 0] }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5 }, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
            className="pointer-events-none absolute -right-14 top-1/2 -translate-y-1/2"
          >
            {(() => {
              const RoleIcon = ROLES.find((r) => r.key === role)?.icon || Sparkles;
              return <RoleIcon size={360} strokeWidth={1} className="text-white" />;
            })()}
          </motion.div>
        </AnimatePresence>

        <div
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }} className="relative mb-8 inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] py-1.5 pl-1.5 pr-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
            {slideIndex + 1}
          </span>
          <div className="flex items-center gap-1">
            <span className="h-1 w-20 overflow-hidden rounded-full bg-white/10">
              <motion.span
                className="block h-full rounded-full bg-orange-500"
                initial={false}
                animate={{ width: `${((slideIndex + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </span>
          </div>
          <span className="text-xs font-semibold text-white/50">{SLIDE_LABELS[currentSlide]}</span>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div key={role} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }} className="relative">
            <h1 className="max-w-md text-4xl font-bold leading-tight text-white">
              {ROLE_CONTENT[role].headline} <span className="brand-gradient-text">{ROLE_CONTENT[role].highlight}</span>
            </h1>
            <p className="mt-4 max-w-sm text-white/60">{ROLE_CONTENT[role].subtext}</p>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="relative mt-14 flex items-center gap-5"
        >
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50">
            <ShieldCheck size={13} className="text-emerald-400" /> Secure &amp; Encrypted
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/50">
            <Zap size={13} className="text-orange-400" /> Trusted by 50K+
          </span>
        </motion.div>
        </motion.div>
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-3 py-8 sm:px-gutter sm:py-12 lg:py-16">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 right-[10%] h-80 w-80 rounded-full bg-pink-500/10 blur-[110px]"
            animate={{ x: [0, -20, 15, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-10%] left-[8%] h-72 w-72 rounded-full bg-orange-500/10 blur-[100px] lg:block"
            animate={{ x: [0, 20, -15, 0], y: [0, -15, 10, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />

        {[
          { top: '12%', left: '8%', size: 5, delay: 0 },
          { top: '22%', right: '10%', size: 3, delay: 0.5 },
          { top: '75%', left: '12%', size: 4, delay: 1 },
          { top: '85%', right: '14%', size: 3, delay: 1.5 },
        ].map((p, i) => (
          <motion.span
            key={i}
            className="pointer-events-none absolute rounded-full bg-orange-400/40"
            style={{ top: p.top, left: p.left, right: p.right, width: p.size, height: p.size }}
            animate={{ opacity: [0.2, 0.8, 0.2], y: [0, -10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          />
        ))}

        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-orange-400/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-pink-400/[0.08]"
          animate={{ rotate: -360 }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        />
        </div>

        <Container className="!max-w-[calc(100%-0.5rem)] !px-0 sm:!max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ boxShadow: '0 30px 60px -20px rgba(249,67,110,0.15)' }}
            className="relative rounded-3xl border border-white/10 bg-navy-800/60 p-6 shadow-lifted backdrop-blur-sm sm:rounded-[2rem] sm:p-9"
          >
            <div className="mb-7 lg:hidden">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center">
                  <Logo className="h-7 w-auto" />
                </Link>
                <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    {slideIndex + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-white/45">of {totalSteps}</span>
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1.5">
                {slides.map((s, i) => (
                  <span key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      className="block h-full rounded-full bg-orange-500"
                      initial={false}
                      animate={{ width: i <= slideIndex ? '100%' : '0%' }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                    />
                  </span>
                ))}
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="text-center"
              >
                {(() => {
                  const RoleIcon = ROLES.find((r) => r.key === role)?.icon || Sparkles;
                  const StepIcon = currentSlide === 'role' ? RoleIcon : STEP_ICONS[currentSlide] || Sparkles;
                  return (
                    <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500/20 to-pink-500/10 text-orange-400 ring-1 ring-inset ring-white/10">
                      <StepIcon size={18} />
                    </span>
                  );
                })()}
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-300/70">
                  {SLIDE_LABELS[currentSlide]}
                </span>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-white">{slideTitles[currentSlide]}</h1>
                {showRequiredLegend && (
                  <p className="mt-1.5 text-xs text-white/40">
                    Fields marked <span className="font-semibold text-orange-400">*</span> are required
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto', marginTop: 20 }}
                  exit={{ opacity: 0, y: -8, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 rounded-2xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3.5 shadow-[0_8px_24px_-12px_rgba(239,68,68,0.35)]">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                      <AlertCircle size={16} />
                    </span>
                    <p className="pt-1.5 text-sm font-medium leading-snug text-red-200">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <ErrorBoundary key={currentSlide} label={`Signup — ${currentSlide} step`}>
              <AnimatePresence mode="wait">
                {currentSlide === 'role' && (
                <motion.div key="role" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
                  <p className="mt-1 text-center text-sm text-white/60">
                    {viaGoogle ? `Signed in as ${name || email} — pick the option that fits you.` : 'Pick the option that fits you, then continue with Google.'}
                  </p>

              <div className="mt-6 grid grid-cols-2 gap-3.5">
                    {ROLES.map((r, idx) => {
                      const selected = role === r.key;
                      return (
                        <motion.button
                          key={r.key}
                          type="button"
                          onClick={() => setRole(r.key)}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: idx * 0.05 }}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            'relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-4 text-left transition-colors duration-200',
                            selected
                              ? 'border-orange-400/60 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,0.15),0_8px_24px_-8px_rgba(249,67,110,0.35)]'
                              : 'border-white/10 bg-navy-800/50 hover:border-white/25 hover:bg-navy-800/80'
                          )}
                        >
                          {selected && (
                            <motion.span
                              layoutId="role-check"
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                              className="absolute right-2.5 top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white"
                            >
                              <CheckCircle2 size={13} strokeWidth={3} />
                            </motion.span>
                          )}
                          <motion.span
                            animate={selected ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                            transition={{ duration: 0.35 }}
                            className={cn('flex h-9 w-9 items-center justify-center rounded-xl transition-colors', selected ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/60')}
                          >
                            <r.icon size={17} />
                          </motion.span>
                          <span className="text-sm font-bold text-white">{r.label}</span>
                          <span className="text-[11px] leading-snug text-white/40">{r.tagline}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {!viaGoogle && (
                    <label className="mt-5 block">
                      <FieldLabel label="Referral code" />
                      <input
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value)}
                        placeholder="Enter a referral code"
                        className="w-full rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                      />
                    </label>
                  )}

                  {viaGoogle ? (
                    <button
                      type="button"
                      onClick={handleRoleContinue}
                      disabled={loading}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-orange-500 hover:bg-orange-600"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Continue as {ROLES.find((r) => r.key === role)?.label} <ArrowRight size={18} /></>}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleGoogle}
                        disabled={googleLoading}
                        className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-orange-500 hover:bg-orange-600"
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

              {currentSlide === 'personal' && (
                <motion.div key="personal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-5">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"><CheckCircle2 size={16} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{email}</p>
                      <p className="truncate text-xs text-white/50">Google account</p>
                    </div>
                  </div>

                  <TextField label="Full name" icon={User} value={name} onChange={setName} placeholder="e.g. Priya Sharma" required />
                  <TextField
                    label="Phone number"
                    icon={Phone}
                    value={phone}
                    onChange={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                    placeholder="10-digit mobile number"
                    type="tel"
                    maxLength={10}
                    required
                  />
                  <label className="block">
                    <FieldLabel label="Location" required />
                    <LocationAutocomplete
                      icon={MapPin}
                      mode="api"
                      value={location}
                      onChange={setLocation}
                      placeholder="City, country"
                      required
                    />
                  </label>

                  <StepNav onBack={goBack} onNext={handleStepNext} loading={loading} />
                </motion.div>
              )}

              {currentSlide === 'work' && (
                <motion.div key="work" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-5">
                  {role === 'creator' && (
                    <>
                      <TextField label="Title / Tagline" value={title} onChange={setTitle} placeholder="e.g. Photographer & Filmmaker" required />
                      <label className="block">
                        <FieldLabel label="Bio" required />
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A short bio about you and your work" rows={3} maxLength={500} required className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
                      </label>
                      <label className="block">
                        <FieldLabel label="Category" required />
                        <div className="relative">
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            className="w-full appearance-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 pr-10 text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                          >
                            {categories.map((c) => (
                              <option key={c._id} value={c._id} className="bg-[#141414] text-white">
                                {c.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
                        </div>
                      </label>
                      <TextField label="Skills" icon={Tag} value={skills} onChange={setSkills} placeholder="Comma separated, e.g. Editing, Reels" required />
                      <TextField label="Languages" icon={LanguagesIcon} value={languages} onChange={setLanguages} placeholder="Comma separated" required />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="Response time" icon={Clock} value={responseTime} onChange={setResponseTime} placeholder="e.g. Within a day" required />
                        <TextField label="Years of experience" icon={Briefcase} value={yearsOfExperience} onChange={setYearsOfExperience} placeholder="e.g. 3" type="number" required />
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-navy-800/50 px-4 py-3.5">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white/80">Available for work</p>
                          <p className="text-xs text-white/40">{isAvailableForWork ? 'Visible as open to bookings' : 'Hidden from new bookings'}</p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAvailableForWork}
                          onClick={() => setIsAvailableForWork((v) => !v)}
                          className={cn(
                            'relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200',
                            isAvailableForWork ? 'bg-emerald-500' : 'bg-white/15'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200',
                              isAvailableForWork ? 'translate-x-5' : 'translate-x-0'
                            )}
                          />
                        </button>
                      </div>
                    </>
                  )}

                  {role === 'brand' && (
                    <>
                      <TextField label="Company name" icon={Building2} value={companyName} onChange={setCompanyName} placeholder="e.g. Glow Cosmetics" required />
                      <TextField label="Tagline" value={tagline} onChange={setTagline} placeholder="One line that sums up your brand" required />
                      <label className="block">
                        <FieldLabel label="About your brand" required />
                        <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="What does your brand do?" rows={3} maxLength={500} required className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/40 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20" />
                      </label>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block">
                          <FieldLabel label="Industry" required />
                          <div className="relative">
                            <select
                              value={industry}
                              onChange={(e) => setIndustry(e.target.value)}
                              required
                              className="w-full appearance-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 pr-10 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                            >
                              <option value="" className="bg-[#141414]">Select industry</option>
                              {INDUSTRIES.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#141414] text-white">
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
                          </div>
                        </label>
                        <TextField label="Founded year" icon={Calendar} value={foundedYear} onChange={setFoundedYear} placeholder="e.g. 2019" type="number" required />
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="block">
                          <FieldLabel label="Company size" required />
                          <div className="relative">
                            <select
                              value={companySize}
                              onChange={(e) => setCompanySize(e.target.value)}
                              required
                              className="w-full appearance-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 pr-10 text-sm text-white outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                            >
                              <option value="" className="bg-[#141414]">Select size</option>
                              {COMPANY_SIZES.map((opt) => (
                                <option key={opt} value={opt} className="bg-[#141414] text-white">
                                  {opt}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/40" />
                          </div>
                        </label>
                        <TextField label="Your designation" value={contactDesignation} onChange={setContactDesignation} placeholder="e.g. Marketing Head" required />
                      </div>
                      <TextField label="What you offer" icon={Tag} value={whatWeOffer} onChange={setWhatWeOffer} placeholder="Comma separated" required />
                      <TextField label="Target audience" value={targetAudience} onChange={setTargetAudience} placeholder="e.g. Women 18-30" required />
                    </>
                  )}

                  {role === 'agency' && (
                    <>
                      <TextField label="Agency name" icon={Building2} value={companyName} onChange={setCompanyName} placeholder="e.g. Creator Hub Agency" required />
                      <TextField label="Contact person" icon={User} value={ownerName} onChange={setOwnerName} placeholder="Full name" required />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="City" icon={MapPin} value={city} onChange={setCity} placeholder="e.g. Mumbai" required />
                        <TextField label="State" value={agencyState} onChange={setAgencyState} placeholder="e.g. Maharashtra" required />
                      </div>
                      <TextField label="GST number" icon={FileText} value={gstNumber} onChange={setGstNumber} placeholder="15-character GSTIN" required />
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <TextField label="Team size" icon={Users2} value={teamSize} onChange={setTeamSize} placeholder="e.g. 1-10" required />
                        <TextField label="Years in business" icon={Calendar} value={yearsInBusiness} onChange={setYearsInBusiness} placeholder="e.g. 2" type="number" required />
                      </div>
                      <TextField label="Specialization" value={specialization} onChange={setSpecialization} placeholder="e.g. Fashion creators" required />
                      <p className="rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-xs text-white/50">
                        Your agency needs admin approval before the dashboard unlocks.
                      </p>
                    </>
                  )}

                  <StepNav onBack={goBack} onNext={handleStepNext} loading={loading} />
                </motion.div>
              )}

              {currentSlide === 'social' && (
                <motion.div key="social" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6 space-y-5">
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
                    <span className="flex items-center gap-1 text-xs font-semibold text-white/60">
                      {photoFile ? photoLabel : googleAvatarUrl ? `Tap to upload your own ${photoLabel.toLowerCase()}` : photoLabel}
                      <span className="text-orange-400">*</span>
                    </span>
                  </div>

                  {(role === 'creator' || role === 'brand') && (
                    <>
                      <SocialUrlField
                        label="Instagram profile"
                        icon={Instagram}
                        platform="instagram"
                        value={instagram}
                        onChange={setInstagram}
                        placeholder="https://instagram.com/yourhandle"
                        required
                      />
                      <SocialUrlField
                        label="YouTube channel"
                        icon={Youtube}
                        platform="youtube"
                        value={youtube}
                        onChange={setYoutube}
                        placeholder="https://youtube.com/@yourchannel"
                      />
                      {role === 'creator' && (
                        <SocialUrlField
                          label="Facebook profile"
                          icon={Facebook}
                          platform="facebook"
                          value={facebook}
                          onChange={setFacebook}
                          placeholder="https://facebook.com/yourpage"
                        />
                      )}
                      {role === 'brand' && (
                        <SocialUrlField
                          label="LinkedIn page"
                          icon={Globe}
                          platform="linkedin"
                          value={linkedin}
                          onChange={setLinkedin}
                          placeholder="https://linkedin.com/company/yourcompany"
                        />
                      )}
                      <SocialUrlField
                        label="Website"
                        icon={Globe}
                        platform="website"
                        value={website}
                        onChange={setWebsite}
                        placeholder="https://yourwebsite.com"
                      />
                    </>
                  )}

                  {role === 'agency' && (
                    <label className="block">
                      <FieldLabel label="ID / Address proof" required />
                      <input type="file" accept="image/*" onChange={handleDocumentSelect} required className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-sm text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-orange-300" />
                    </label>
                  )}

                  <StepNav onBack={goBack} onNext={handleSocialNext} loading={loading} />
                </motion.div>
              )}

           {currentSlide === 'review' && (
                <motion.div key="review" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="mt-6">
                  <div className="flex flex-col items-center text-center">
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.05 }}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-4 ring-emerald-500/10"
                    >
                      <CheckCircle2 size={30} />
                    </motion.span>
                    <h2 className="mt-4 text-lg font-bold text-white">You're all set!</h2>
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-300">
                      {(() => {
                        const RoleIcon = ROLES.find((r) => r.key === role)?.icon || Sparkles;
                        return <RoleIcon size={12} />;
                      })()}
                      Signing up as {ROLES.find((r) => r.key === role)?.label || 'Fan'}
                    </span>
                  </div>

                  <div className="mt-6 divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/10 bg-navy-800/50">
                    <SummaryRow icon={User} label="Name" value={role === 'agency' ? companyName.trim() || name : name} />
                    <SummaryRow icon={Mail} label="Email" value={email} />
                    <SummaryRow icon={Phone} label="Phone" value={phone ? `+91 ${phone}` : ''} />
                    <SummaryRow
                      icon={MapPin}
                      label="Location"
                      value={role === 'agency' ? [city, agencyState].filter(Boolean).join(', ') : location}
                    />
                    {role === 'creator' && <SummaryRow icon={Sparkles} label="Title" value={title} />}
                    {(role === 'brand' || role === 'agency') && (
                      <SummaryRow icon={Building2} label={role === 'brand' ? 'Company' : 'Agency'} value={companyName} />
                    )}
                  </div>

                  {role !== 'fan' && (
                    <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-3">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-orange-400" />
                      <p className="text-left text-xs leading-relaxed text-white/50">
                        Your details will be sent to the Fanitt team for approval before the full dashboard unlocks.
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-3">
                    <button type="button" onClick={goBack} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-3 text-sm font-semibold text-white/70 transition-colors hover:border-white/30">
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={handleFinish}
                      disabled={loading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-orange-500 hover:bg-orange-600"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <>Finish <ArrowRight size={18} /></>}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </ErrorBoundary>
          </motion.div>
        </Container>
      </div>

     <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 320, damping: 24 }}
              className="relative w-full max-w-xs overflow-hidden rounded-3xl border border-white/10 bg-navy-800 p-7 text-center shadow-lifted sm:max-w-sm"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-emerald-500/10 blur-3xl" />

              <div className="relative flex flex-col items-center">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 380, damping: 14 }}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400"
                >
                  <motion.span
                    className="absolute inset-0 rounded-full border-2 border-emerald-400/40"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
                  />
                  <CheckCircle2 size={30} />
                </motion.span>

                <p className="mt-4 text-lg font-bold text-white">Profile submitted!</p>
                <p className="mt-1 text-sm text-white/50">Taking you to the next step...</p>

                <span className="mt-5 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    className="block h-full rounded-full bg-emerald-500"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.6, ease: 'linear' }}
                  />
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

  );
}

// Small label row used above every field: shows a required "*" in orange,
// or a muted "(optional)" hint when the field isn't mandatory.
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-white/80">
      {label}
      {required ? (
        <span className="font-bold text-orange-400">*</span>
      ) : (
        <span className="text-[11px] font-normal text-white/35">(optional)</span>
      )}
    </span>
  );
}

// One row in the Review step's summary card. Renders nothing when the value
// is empty, so optional/skipped fields don't leave a blank row.
function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  if (!value?.trim()) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/50">
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[11px] font-medium uppercase tracking-wide text-white/35">{label}</p>
        <p className="truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  );
}

function TextField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  maxLength,
}: {
  label?: string;
  icon?: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      {label && <FieldLabel label={label} required={required} />}
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />}
        <input
          required={required}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className={cn(
            'w-full rounded-xl border border-white/10 bg-navy-800/70 py-3.5 pr-4 text-white placeholder:text-white/40 transition-colors focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20',
            Icon ? 'pl-11' : 'pl-4'
          )}
        />
      </div>
    </label>
  );
}

// Social profile URL field — validates against the platform's URL pattern as
// the person types, and shows a green check + green border once it matches.
function SocialUrlField({
  label,
  icon: Icon,
  platform,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string;
  icon: LucideIcon;
  platform: keyof typeof SOCIAL_URL_PATTERNS;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
}) {
  const trimmed = value.trim();
  const isValid = trimmed.length > 0 && isValidSocialUrl(platform, trimmed);
  const isInvalid = trimmed.length > 0 && !isValid;

  return (
    <label className="block">
      <FieldLabel label={label} required={required} />
      <div className="relative">
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="url"
          inputMode="url"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border bg-navy-800/70 py-3.5 pl-11 pr-10 text-white placeholder:text-white/40 transition-colors focus:ring-2',
            isValid
              ? 'border-emerald-400/60 focus:border-emerald-400 focus:ring-emerald-400/20'
              : isInvalid
                ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                : 'border-white/10 focus:border-orange-400 focus:ring-orange-400/20'
          )}
        />
        {isValid && (
          <CheckCircle2 size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
      </div>
      {isInvalid && (
        <span className="mt-1 block text-xs text-red-300/80">Enter a valid {label.toLowerCase()} URL</span>
      )}
    </label>
  );
}

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
        className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-base font-semibold text-white shadow-card transition-all hover:shadow-glow disabled:opacity-50 bg-orange-500 hover:bg-orange-600"
      >
        Continue <ArrowRight size={18} />
      </button>
    </div>
  );
}
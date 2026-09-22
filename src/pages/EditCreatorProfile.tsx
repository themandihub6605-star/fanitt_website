import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Camera,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Instagram,
  Youtube,
  Globe,
  MapPin,
  Clock,
  Languages as LanguagesIcon,
  Tag,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { LocationAutocomplete } from '@/components/LocationAutocomplete';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { userApi } from '@/services/userApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { cn } from '@/utils/cn';

// Small label row used above every field: shows a required "*" in orange,
// or a muted "(optional)" hint when the field isn't mandatory — same
// pattern as the Signup flow, so Edit Profile reads consistently with it.
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

// Same validation Signup uses for social profile URLs — full profile links,
// not bare handles, so Edit Profile enforces exactly the same format.
const SOCIAL_URL_PATTERNS: Record<'instagram' | 'youtube' | 'website', RegExp> = {
  instagram: /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9._]{1,30}\/?(\?.*)?$/i,
  youtube: /^(https?:\/\/)?(www\.)?(youtube\.com\/(channel\/|c\/|@)?[\w.-]+|youtu\.be\/[\w.-]+)\/?(\?.*)?$/i,
  website: /^(https?:\/\/)?([\w-]+\.)+[a-zA-Z]{2,}([/?#].*)?$/i,
};

const isValidSocialUrl = (platform: keyof typeof SOCIAL_URL_PATTERNS, value: string) =>
  SOCIAL_URL_PATTERNS[platform].test(value.trim());

const normalizeUrl = (value: string) => {
  const v = value.trim();
  if (!v) return '';
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
};

// Old data may have been stored as a bare handle rather than a full URL —
// turn it into a full profile URL for display so the validator below
// doesn't immediately flag existing values as invalid.
const toProfileUrl = (platform: 'instagram' | 'youtube', value: string) => {
  const v = value.trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return platform === 'instagram' ? `https://instagram.com/${v}` : `https://youtube.com/@${v}`;
};

// Social profile URL field — validates against the platform's URL pattern as
// the person types, and shows a green check + green border once it matches.
// Copied from the Signup flow so Edit Profile enforces the exact same rules.
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
  icon: typeof Instagram;
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
        <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full rounded-xl border bg-navy-800/70 py-3 pl-10 pr-10 text-white placeholder:text-white/30 transition-colors focus:ring-2',
            isValid
              ? 'border-emerald-400/60 focus:border-emerald-400 focus:ring-emerald-400/20'
              : isInvalid
                ? 'border-red-400/50 focus:border-red-400 focus:ring-red-400/20'
                : 'border-white/10 focus:border-orange-400 focus:ring-orange-400/20'
          )}
        />
        {isValid && (
          <CheckCircle2 size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400" />
        )}
      </div>
      {isInvalid && (
        <span className="mt-1 block text-xs text-red-300/80">Enter a valid {label.toLowerCase()} URL</span>
      )}
    </label>
  );
}

export default function EditCreatorProfile() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [isAvailableForWork, setIsAvailableForWork] = useState(true);
  const [responseTime, setResponseTime] = useState('');
  const [languages, setLanguages] = useState('');
  const [skills, setSkills] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [behance, setBehance] = useState('');
  const [website, setWebsite] = useState('');
  // Captured on load so we know, at save time, whether this save is a
  // resubmission (was rejected/unverified) or just a normal edit by an
  // already-verified creator — only the former should route back to the
  // pending-approval screen afterward.
  const wasUnapprovedRef = useRef(false);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));

    creatorApi
      .getMyProfile()
      .then((c: ApiCreator) => {
        wasUnapprovedRef.current = c.verificationStatus === 'rejected' || c.verificationStatus === 'unverified';
        setTitle(c.title || '');
        setBio(c.bio || '');
        setCategory(c.category?._id || '');
        setLocation(c.location || '');
        setIsAvailableForWork(c.isAvailableForWork !== false);
        setResponseTime(c.responseTime || '');
        setLanguages((c.languages || []).join(', '));
        setSkills((c.skills || []).join(', '));
        setInstagram(toProfileUrl('instagram', c.socials?.instagram || ''));
        setYoutube(toProfileUrl('youtube', c.socials?.youtube || ''));
        setBehance(c.socials?.behance || '');
        setWebsite(c.socials?.website || '');
        setPhotoPreview(c.user.avatarUrl || '');
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Same required set as the Signup flow's "work" step for creators (title,
  // bio, category, skills, languages, responseTime), plus location (required
  // on Signup's "personal" step) and Instagram (required on Signup's
  // "social" step for creators). Everything else here stays optional.
  const validate = (): string | null => {
    // photoPreview is populated either from the existing avatar loaded on
    // mount, or from a newly selected file — so this only blocks people who
    // have never had a photo, not everyone on every edit.
    if (!photoPreview) return 'Profile photo is required';
    if (!title.trim()) return 'Title / Tagline is required';
    if (!bio.trim()) return 'Bio is required';
    if (!category) return 'Please select a category';
    if (!location.trim()) return 'Location is required';
    if (!responseTime.trim()) return 'Response time is required';
    if (!languages.trim()) return 'Languages are required';
    if (!skills.trim()) return 'Skills are required';
    if (!instagram.trim()) return 'Instagram profile is required';
    if (!isValidSocialUrl('instagram', instagram)) return 'Please enter a valid Instagram profile URL';
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    try {
      if (photoFile) {
        const { avatarUrl } = await userApi.uploadAvatar(photoFile);
        dispatch(updateUser({ avatarUrl }));
      }

      await creatorApi.updateMyProfile({
        title,
        bio,
        category: (category || undefined) as any,
        location,
        isAvailableForWork,
        responseTime,
        languages: languages.split(',').map((s) => s.trim()).filter(Boolean),
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        socials: {
          ...(instagram && { instagram: normalizeUrl(instagram) }),
          ...(youtube && { youtube: normalizeUrl(youtube) }),
          ...(behance && { behance: behance.startsWith('http') ? behance : `https://behance.net/${behance}` }),
          ...(website && { website: normalizeUrl(website) }),
        },
        submitForApproval: true,
      });

      setSaved(true);
      if (wasUnapprovedRef.current) {
        // Resubmitting after rejection (or first-time submit) — the backend
        // just flipped verificationStatus back to 'pending', so route back
        // to the pending-approval screen instead of leaving them on the
        // edit form as if nothing changed.
        setTimeout(() => navigate('/pending-approval'), 1000);
      } else {
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit Your Profile</h1>
        <p className="mt-1 text-sm text-white/60">This is what people see on your public creator page.</p>
        <p className="mt-1 text-xs text-white/40">
          Fields marked <span className="font-semibold text-orange-400">*</span> are required
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Profile saved — your public page is updated.
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSave}>
          {/* Photo */}
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-white/15 bg-navy-800/60 text-white/40 hover:border-orange-400/50"
            >
              {photoPreview ? <img src={photoPreview} alt="" className="h-full w-full object-cover" /> : <Camera size={20} />}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-white" />
              </span>
            </button>
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                Profile photo <span className="font-bold text-orange-400">*</span>
              </p>
              <p className="text-xs text-white/50">JPG or PNG, shown on your public page and dashboard.</p>
            </div>
          </div>

          {/* Availability toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <div>
              <p className="text-sm font-semibold text-white">Available for Work</p>
              <p className="text-xs text-white/50">Shows a live badge on your profile when brands are looking.</p>
            </div>
           <button
  type="button"
  onClick={() => setIsAvailableForWork((v) => !v)}
  className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors', isAvailableForWork ? 'bg-emerald-500' : 'bg-white/15')}
>
  <span
    className={cn(
      'absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-md transition-transform',
      isAvailableForWork ? 'translate-x-5' : 'translate-x-0'
    )}
  />
</button>
          </div>

          {/* Basics */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Basics</p>

            <label className="block">
              <FieldLabel label="Title / Tagline" required />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Photographer & Cinematographer"
                maxLength={80}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </label>

            <label className="block">
              <FieldLabel label="Bio" required />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell brands and fans what you do..."
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
              <span className="mt-1 block text-right text-xs text-white/30">{bio.length}/500</span>
            </label>

            <label className="block">
              <FieldLabel label="Category" required />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400"
              >
                <option value="" className="bg-[#141414]">Select a category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id} className="bg-[#141414]">{c.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <FieldLabel label="Location" required />
              <LocationAutocomplete
                icon={MapPin}
                mode="api"
                value={location}
                onChange={setLocation}
                placeholder="e.g. Delhi NCR, India"
              />
            </label>
          </div>

          {/* Trust details */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Trust &amp; Response</p>

            <label className="block">
              <FieldLabel label="Response Time" required />
              <div className="relative">
                <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  placeholder="e.g. Within 2 hours"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </div>
            </label>

            <label className="block">
              <FieldLabel label="Languages (comma separated)" required />
              <div className="relative">
                <LanguagesIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="English, Hindi"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </div>
            </label>

            <label className="block">
              <FieldLabel label="Skills / tags (comma separated)" required />
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="Portrait, Lifestyle, Travel, Commercial"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </div>
            </label>
          </div>

          {/* Socials */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Social Links</p>

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

            <label className="block">
              <FieldLabel label="Behance username" />
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">Be</span>
                <input value={behance} onChange={(e) => setBehance(e.target.value)} placeholder="yourusername" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

            <SocialUrlField
              label="Website"
              icon={Globe}
              platform="website"
              value={website}
              onChange={setWebsite}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/creator')}>
              Cancel
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}
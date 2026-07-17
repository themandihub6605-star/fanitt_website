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
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { userApi } from '@/services/userApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppDispatch } from '@/store/hooks';
import { updateUser } from '@/store/slices/authSlice';
import { cn } from '@/utils/cn';

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

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));

    creatorApi
      .getMyProfile()
      .then((c: ApiCreator) => {
        setTitle(c.title || '');
        setBio(c.bio || '');
        setCategory(c.category?._id || '');
        setLocation(c.location || '');
        setIsAvailableForWork(c.isAvailableForWork !== false);
        setResponseTime(c.responseTime || '');
        setLanguages((c.languages || []).join(', '));
        setSkills((c.skills || []).join(', '));
        setInstagram(c.socials?.instagram || '');
        setYoutube(c.socials?.youtube || '');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
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
          ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
          ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
          ...(behance && { behance: behance.startsWith('http') ? behance : `https://behance.net/${behance}` }),
          ...(website && { website: website.startsWith('http') ? website : `https://${website}` }),
        },
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
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
              <p className="text-sm font-semibold text-white">Profile photo</p>
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
              <span className={cn('absolute top-1 h-5 w-5 rounded-full bg-white transition-transform', isAvailableForWork ? 'translate-x-6' : 'translate-x-1')} />
            </button>
          </div>

          {/* Basics */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Basics</p>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Title / Tagline</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Photographer & Cinematographer"
                maxLength={80}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Bio</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Category</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Location</span>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Delhi NCR, India"
                  className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </div>
            </label>
          </div>

          {/* Trust details */}
          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Trust &amp; Response</p>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Response Time</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Languages (comma separated)</span>
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
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Skills / tags (comma separated)</span>
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

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Instagram handle</span>
              <div className="relative">
                <Instagram size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="yourhandle" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">YouTube handle</span>
              <div className="relative">
                <Youtube size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="yourhandle" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Behance username</span>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-white/40">Be</span>
                <input value={behance} onChange={(e) => setBehance(e.target.value)} placeholder="yourusername" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Website</span>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourwebsite.com" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>
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

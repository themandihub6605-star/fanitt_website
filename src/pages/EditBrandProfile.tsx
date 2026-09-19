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
  Building2,
  Calendar,
  Users,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { brandApi, type ApiBrand } from '@/services/brandApi';
import { getApiErrorMessage, getUploadUrl } from '@/services/apiClient';
import { cn } from '@/utils/cn';

export default function EditBrandProfile() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [tagline, setTagline] = useState('');
  const [about, setAbout] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [whatWeOffer, setWhatWeOffer] = useState('');
  const [instagram, setInstagram] = useState('');
  const [youtube, setYoutube] = useState('');
  const [linkedin, setLinkedin] = useState('');

  useEffect(() => {
    brandApi
      .getMyProfile()
      .then((b: ApiBrand) => {
        setCompanyName(b.companyName || '');
        setTagline(b.tagline || '');
        setAbout(b.about || '');
        setWebsite(b.website || '');
        setIndustry(b.industry || '');
        setLocation(b.location || '');
        setFoundedYear(b.foundedYear ? String(b.foundedYear) : '');
        setCompanySize(b.companySize || '');
        setWhatWeOffer((b.whatWeOffer || []).join(', '));
        setInstagram(b.socials?.instagram || '');
        setYoutube(b.socials?.youtube || '');
        setLinkedin(b.socials?.linkedin || '');
        setLogoPreview(b.logoUrl ? getUploadUrl(b.logoUrl) : '');
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      if (logoFile) {
        await brandApi.uploadLogo(logoFile);
      }

      await brandApi.updateMyProfile({
        companyName,
        tagline,
        about,
        website,
        industry,
        location,
        foundedYear: foundedYear ? Number(foundedYear) : undefined,
        companySize,
        whatWeOffer: whatWeOffer.split(',').map((s) => s.trim()).filter(Boolean),
        socials: {
          ...(instagram && { instagram: instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}` }),
          ...(youtube && { youtube: youtube.startsWith('http') ? youtube : `https://youtube.com/@${youtube}` }),
          ...(linkedin && { linkedin: linkedin.startsWith('http') ? linkedin : `https://linkedin.com/company/${linkedin}` }),
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
        <p className="text-sm">Loading your brand profile...</p>
      </div>
    );
  }

  return (
    <div className="pt-8 pb-16">
      <Container className="!max-w-2xl">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Edit Brand Profile</h1>
        <p className="mt-1 text-sm text-white/60">This is what creators and fans see on your public brand page.</p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        {saved && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={16} className="shrink-0" /> Brand profile saved.
          </div>
        )}

        <form className="mt-6 space-y-6" onSubmit={handleSave}>
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoSelect} className="hidden" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-white/15 bg-navy-800/60 text-white/40 hover:border-orange-400/50"
            >
              {logoPreview ? <img src={logoPreview} alt="" className="h-full w-full object-cover" /> : <Building2 size={20} />}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera size={18} className="text-white" />
              </span>
            </button>
            <div>
              <p className="text-sm font-semibold text-white">Company logo</p>
              <p className="text-xs text-white/50">Shown on your public brand page and campaigns.</p>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Basics</p>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Company name</span>
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Tagline</span>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Clean Beauty • Skin Care • Self Care"
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">About</span>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                maxLength={500}
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white focus:border-orange-400"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Industry</span>
              <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Beauty & Personal Care" className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400" />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Headquarters</span>
              <div className="relative">
                <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Mumbai, Maharashtra, India" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Founded year</span>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input type="number" value={foundedYear} onChange={(e) => setFoundedYear(e.target.value)} placeholder="2019" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
                </div>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-white/80">Company size</span>
                <div className="relative">
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                  <input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="51-200" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
                </div>
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">What We Offer (comma separated)</span>
              <input
                value={whatWeOffer}
                onChange={(e) => setWhatWeOffer(e.target.value)}
                placeholder="Brand Collaborations, Product Reviews, Social Media Campaigns"
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400"
              />
            </label>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/10 bg-navy-800/50 p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-white/40">Social Links</p>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-white/80">Website</span>
              <div className="relative">
                <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="yourbrand.com" className="w-full rounded-xl border border-white/10 bg-navy-800/70 py-3 pl-10 pr-4 text-white placeholder:text-white/30 focus:border-orange-400" />
              </div>
            </label>

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
              <span className="mb-1.5 block text-sm font-semibold text-white/80">LinkedIn</span>
              <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="company-name" className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400" />
            </label>
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={saving} className="flex-1 justify-center">
              {saving ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard/brand')}>
              Cancel
            </Button>
          </div>
        </form>
      </Container>
    </div>
  );
}

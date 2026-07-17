import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  Loader2,
  AlertCircle,
  Gift,
  MessageCircle,
  BadgeCheck,
  ShieldCheck,
  Globe2,
  Calendar,
  Building2,
  ChevronDown,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { SendGiftModal } from '@/components/SendGiftModal';
import { SocialLinks } from '@/components/SocialLinks';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { getUploadUrl } from '@/services/apiClient';
import { brandApi, type ApiBrand } from '@/services/brandApi';
import type { ApiCampaign } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

const TABS = ['Overview', 'Campaigns', 'Services', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function BrandProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<ApiBrand | null>(null);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [campaignsPosted, setCampaignsPosted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Overview');
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    brandApi
      .getBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setBrand(data.brand);
        setCampaigns(data.campaigns);
        setCampaignsPosted(data.stats?.campaignsPosted ?? 0);
      })
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleFollow = async () => {
    if (!isAuthenticated || !brand) return;
    const result = await brandApi.follow(brand._id);
    setFollowing(result.following);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-20 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading brand...</p>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          {error ? <AlertCircle size={28} className="mx-auto mb-3 text-red-400" /> : null}
          <p className="text-white/60">{error || 'Brand not found.'}</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </Container>
      </div>
    );
  }

  const isVerified = brand.verificationStatus === 'verified';
  const websiteHost = brand.website ? brand.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';

  return (
    <div className="pb-24">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <img
          src={brand.coverImageUrl ? getUploadUrl(brand.coverImageUrl) : getCoverPhoto(brand.industry || 'Business Coaching', 1200, 400)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/30" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between sm:inset-x-6">
          <Link to="/explore" className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm hover:text-white">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-2">
            {isVerified && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Verified Brand
              </span>
            )}
            {brand.isTopBrand && (
              <span className="flex flex-col items-center rounded-xl bg-black/50 px-3 py-1.5 text-center backdrop-blur-sm">
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                  <Star size={11} fill="currentColor" /> Top Brand
                </span>
                {brand.industry && <span className="text-[10px] text-white/50">{brand.industry}</span>}
              </span>
            )}
          </div>
        </div>
      </div>

      <Container className="relative -mt-16 sm:-mt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-5 sm:flex-row sm:items-end"
        >
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-orange-500/70 bg-navy-800 object-cover shadow-lifted sm:h-28 sm:w-28">
            {brand.logoUrl ? (
              <img src={getUploadUrl(brand.logoUrl)} alt={brand.companyName} className="h-full w-full rounded-full object-cover" />
            ) : (
              <Building2 size={32} className="text-white/40" />
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{brand.companyName}</h1>
              {isVerified && <BadgeCheck size={20} className="fill-sky-500 text-white" strokeWidth={2.5} />}
            </div>
            <p className="text-sm text-white/50">@{brand.slug}</p>
            {brand.tagline && <p className="mt-1 text-white/80">{brand.tagline}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
              {brand.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {brand.location}
                </span>
              )}
              {brand.website && (
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-orange-400 hover:underline">
                  <Globe2 size={13} /> {websiteHost}
                </a>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pb-1 sm:w-auto">
            <Button className="w-full sm:w-auto" onClick={handleFollow}>
              {following ? 'Following' : 'Follow'}
            </Button>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/messages?with=${brand.user._id}`)}>
              <MessageCircle size={15} /> Message
            </Button>
          </div>
        </motion.div>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <SocialLinks socials={brand.socials} className="flex gap-2" />
          <span className="text-sm text-white/50">
            <b className="text-white">{brand.followerCount.toLocaleString('en-IN')}</b> Followers
          </span>
        </div>

        {/* Trust stats strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-navy-800/50 p-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-300">
              <Star size={15} fill="currentColor" /> {brand.averageRating || '—'}
            </p>
            <p className="text-xs text-white/40">({brand.reviewCount}) Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{campaignsPosted}</p>
            <p className="text-xs text-white/40">Campaigns Posted</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{brand.onTimePaymentsPercent ?? 100}%</p>
            <p className="text-xs text-white/40">On-Time Payments</p>
          </div>
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-lg font-bold text-emerald-400">
              <ShieldCheck size={15} /> Verified
            </p>
            <p className="text-xs text-white/40">Identity &amp; KYC</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors',
                tab === t ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white/80'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {tab === 'Overview' && (
            <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
              <div>
                {brand.about && (
                  <>
                    <h2 className="text-lg font-bold text-white">About {brand.companyName}</h2>
                    <p className={cn('mt-2 max-w-2xl leading-relaxed text-white/70', !aboutExpanded && 'line-clamp-3')}>{brand.about}</p>
                    <button
                      onClick={() => setAboutExpanded((v) => !v)}
                      className="mt-1 flex items-center gap-1 text-sm font-semibold text-orange-400 hover:underline"
                    >
                      {aboutExpanded ? 'Read Less' : 'Read More'} <ChevronDown size={14} className={cn('transition-transform', aboutExpanded && 'rotate-180')} />
                    </button>
                  </>
                )}

                {brand.whatWeOffer && brand.whatWeOffer.length > 0 && (
                  <div className="mt-6">
                    <h2 className="text-lg font-bold text-white">What We Offer</h2>
                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {brand.whatWeOffer.map((item) => (
                        <div key={item} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                          <Sparkles size={18} className="text-orange-400" />
                          <span className="text-xs font-semibold text-white/70">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-fit rounded-2xl border border-white/10 bg-navy-800/50 p-5">
                {brand.foundedYear && (
                  <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-white/50"><Calendar size={14} /> Founded</span>
                    <span className="font-semibold text-white">{brand.foundedYear}</span>
                  </div>
                )}
                {brand.companySize && (
                  <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-white/50"><Users size={14} /> Company Size</span>
                    <span className="font-semibold text-white">{brand.companySize}</span>
                  </div>
                )}
                {brand.industry && (
                  <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-white/50"><Briefcase size={14} /> Industry</span>
                    <span className="font-semibold text-white">{brand.industry}</span>
                  </div>
                )}
                {brand.location && (
                  <div className="flex items-center justify-between py-2.5 text-sm">
                    <span className="flex items-center gap-2 text-white/50"><MapPin size={14} /> Headquarters</span>
                    <span className="font-semibold text-white">{brand.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'Campaigns' && (
            <div>
              {campaigns.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {campaigns.map((c) => (
                    <Link
                      key={c._id}
                      to={`/campaigns/${c._id}`}
                      className="rounded-2xl border border-white/10 bg-navy-800/50 p-5 transition-colors hover:border-orange-500/30"
                    >
                      <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold uppercase text-orange-300">
                        {c.category?.label}
                      </span>
                      <p className="mt-3 font-bold text-white">{c.title}</p>
                      <p className="mt-1 text-sm text-white/50">{formatRupees(c.budget)} &middot; {c.location}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No open campaigns right now.</p>
              )}
            </div>
          )}

          {tab === 'Services' && (
            <div>
              {brand.whatWeOffer && brand.whatWeOffer.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {brand.whatWeOffer.map((item) => (
                    <div key={item} className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                      <Sparkles size={18} className="text-orange-400" />
                      <span className="text-xs font-semibold text-white/70">{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">This brand hasn't listed any services yet.</p>
              )}
            </div>
          )}

          {tab === 'Reviews' && <p className="text-white/50">No reviews yet.</p>}
        </div>
      </Container>
    </div>
  );
}

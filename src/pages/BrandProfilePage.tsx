import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Loader2,
  AlertCircle,
  MessageCircle,
  Sparkles,
  Globe2,
  Calendar,
  Building2,
  Briefcase,
  Users,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
  ExternalLink,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { getUploadUrl } from '@/services/apiClient';
import { brandApi, type ApiBrand } from '@/services/brandApi';
import type { ApiCampaign } from '@/services/campaignApi';
import { reviewApi, type ApiReview } from '@/services/reviewApi';
import { subscriptionApi, type ApiUserSubscription } from '@/services/subscriptionApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

const TABS = ['Reviews', 'Instagram', 'Campaigns'] as const;
type Tab = (typeof TABS)[number];

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BrandProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<ApiBrand | null>(null);
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [tab, setTab] = useState<Tab>('Reviews');
  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const authUser = useAppSelector((s) => s.auth.user);
  const isOwnProfile = Boolean(isAuthenticated && authUser && brand && authUser._id === brand.user._id);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    brandApi
      .getBySlug(slug)
      .then((data) => {
        if (cancelled) return;
        setBrand(data.brand);
        setCampaigns(data.campaigns);
      })
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!brand?.user._id || tab !== 'Reviews') return;
    let cancelled = false;
    setReviewsLoading(true);
    reviewApi
      .getUserReviews(brand.user._id)
      .then((data) => !cancelled && setReviews(data))
      .catch(() => {})
      .finally(() => !cancelled && setReviewsLoading(false));
    return () => {
      cancelled = true;
    };
  }, [brand?.user._id, tab]);

  // Only fetch subscription info once we know this is the logged-in
  // user's own brand profile — a visitor has no business seeing (or
  // upgrading) someone else's plan.
  useEffect(() => {
    if (!isOwnProfile) {
      setMySubscription(null);
      return;
    }
    subscriptionApi
      .getMySubscription()
      .then(setMySubscription)
      .catch(() => setMySubscription(null));
  }, [isOwnProfile]);

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

  const websiteHost = brand.website ? brand.website.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
  const isOnFreePlan = mySubscription ? mySubscription.plan.price === 0 : false;
  const socialEntries = [
    { key: 'instagram', label: 'Instagram', icon: Instagram, url: brand.socials?.instagram },
    { key: 'youtube', label: 'YouTube', icon: Youtube, url: brand.socials?.youtube },
    { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, url: brand.socials?.linkedin },
    { key: 'facebook', label: 'Facebook', icon: Facebook, url: brand.socials?.facebook },
  ].filter((s) => s.url);

  return (
    <div className="pb-24">
      {/* Gradient header */}
      <div className="relative h-40 w-full overflow-hidden sm:h-48">
        <img
          src={brand.coverImageUrl ? getUploadUrl(brand.coverImageUrl) : getCoverPhoto(brand.industry || 'Business', 1200, 400)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/40 via-navy-900/70 to-navy-900" />

        <Link to="/campaigns" className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm hover:text-white sm:left-6 sm:top-6">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <Container className="relative -mt-14 text-center sm:-mt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-navy-900 bg-navy-800 shadow-lifted sm:h-28 sm:w-28">
            {brand.logoUrl ? (
              <img src={getUploadUrl(brand.logoUrl)} alt={brand.companyName} className="h-full w-full object-cover" />
            ) : (
              <Building2 size={32} className="text-white/40" />
            )}
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{brand.companyName}</h1>
            {isOwnProfile && mySubscription && (
              <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-bold text-orange-300">
                <Sparkles size={12} /> {mySubscription.plan.name} Plan
              </span>
            )}
            {isOwnProfile && isOnFreePlan && (
              <Link
                to="/pricing"
                className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white hover:bg-orange-600"
              >
                Upgrade
              </Link>
            )}
          </div>
          {brand.industry && <p className="mt-1 text-sm text-orange-300">{brand.industry}</p>}

          <div className="mt-4 flex items-center justify-center gap-3">
            <Button onClick={handleFollow}>{following ? 'Following' : 'Follow'}</Button>
            <Button variant="outline" onClick={() => navigate(`/messages?with=${brand.user._id}`)}>
              <MessageCircle size={15} /> Message
            </Button>
          </div>
        </motion.div>

        {/* Business Details card */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-navy-800/50 p-5 text-left">
          <p className="mb-3 text-sm font-bold text-white">Business Details</p>
          <div className="divide-y divide-white/5">
            {brand.location && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-white/50"><MapPin size={14} /> Headquarters</span>
                <span className="font-semibold text-white">{brand.location}</span>
              </div>
            )}
            {brand.foundedYear && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-white/50"><Calendar size={14} /> Founded</span>
                <span className="font-semibold text-white">{brand.foundedYear}</span>
              </div>
            )}
            {brand.companySize && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-white/50"><Users size={14} /> Company Size</span>
                <span className="font-semibold text-white">{brand.companySize}</span>
              </div>
            )}
            {brand.website && (
              <div className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2 text-white/50"><Globe2 size={14} /> Website</span>
                <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 font-semibold text-orange-400 hover:underline">
                  {websiteHost} <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
          {brand.about && <p className="mt-3 border-t border-white/5 pt-3 text-sm leading-relaxed text-white/60">{brand.about}</p>}
        </div>

        {/* Trust stats strip */}
        <div className="mt-4 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-navy-800/50 p-4">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-300">
              <Star size={15} fill="currentColor" /> {brand.averageRating || '—'}
            </p>
            <p className="text-xs text-white/40">({brand.reviewCount}) Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{brand.totalCampaigns}</p>
            <p className="text-xs text-white/40">Campaigns</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{brand.followerCount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-white/40">Followers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex justify-center gap-1 border-b border-white/10">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition-colors',
                tab === t ? 'border-orange-500 text-orange-400' : 'border-transparent text-white/50 hover:text-white/80'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-6 text-left">
          {tab === 'Reviews' && (
            <div className="space-y-3">
              {reviewsLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-white/40" />
                </div>
              )}
              {!reviewsLoading && reviews.length === 0 && <p className="text-center text-white/50">No reviews yet.</p>}
              {!reviewsLoading &&
                reviews.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-white/10 bg-navy-800/50 p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={r.fromUser.avatarUrl || `https://i.pravatar.cc/80?u=${r.fromUser.name}`}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{r.fromUser.name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'} />
                          ))}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-white/40">{formatDate(r.createdAt)}</span>
                    </div>
                    {r.comment && <p className="mt-2 text-sm text-white/70">{r.comment}</p>}
                  </div>
                ))}
            </div>
          )}

          {tab === 'Instagram' && (
            <div>
              {socialEntries.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {socialEntries.map((s) => (
                    <a
                      key={s.key}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/50 p-4 transition-colors hover:border-orange-400/40"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                        <s.icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{s.label}</p>
                        <p className="truncate text-xs text-white/50">{s.url}</p>
                      </div>
                      <ExternalLink size={14} className="shrink-0 text-white/30" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-center text-white/50">This brand hasn't linked any social accounts yet.</p>
              )}
            </div>
          )}

          {tab === 'Campaigns' && (
            <div>
              {campaigns.length > 0 ? (
                <div className="space-y-4">
                  {campaigns.map((c) => {
                    const hasDeliverables = c.deliverables && (c.deliverables.reel || c.deliverables.story || c.deliverables.post);
                    return (
                      <Link
                        key={c._id}
                        to={`/campaigns/${c._id}`}
                        className="flex gap-4 rounded-2xl border border-white/10 bg-navy-800/60 p-4 backdrop-blur-xl transition-colors hover:border-orange-400/40"
                      >
                        <div className="relative w-24 shrink-0 self-stretch overflow-hidden rounded-lg bg-white/5">
                          {c.campaignImageUrl ? (
                            <img src={c.campaignImageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-white/20">
                              <Briefcase size={20} />
                            </div>
                          )}
                          <span
                            className={cn(
                              'absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white',
                              c.campaignType === 'paid' ? 'bg-emerald-500' : 'bg-sky-500'
                            )}
                          >
                            {c.campaignType === 'paid' ? 'Paid' : 'Barter'}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          {c.category && (
                            <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold uppercase text-orange-300">
                              {c.category.label}
                            </span>
                          )}
                          <p className="mt-1.5 truncate font-bold text-white">{c.title}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white/80">
                            <Briefcase size={13} className="text-orange-400" />
                            {c.campaignType === 'paid' ? formatRupees(c.budget) : `${c.products.length} product(s)`}
                          </p>

                          <div className="mt-2 flex w-fit items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                            <Instagram size={11} /> {c.applicantCount} Creators Applied
                          </div>

                          {hasDeliverables && (
                            <div className="mt-2 flex divide-x divide-white/10 overflow-hidden rounded-lg border border-white/10 text-center">
                              <div className="flex-1 py-1">
                                <p className="text-xs font-bold text-white">{c.deliverables.reel}</p>
                                <p className="text-[9px] text-white/40">Reel</p>
                              </div>
                              <div className="flex-1 py-1">
                                <p className="text-xs font-bold text-white">{c.deliverables.story}</p>
                                <p className="text-[9px] text-white/40">Story</p>
                              </div>
                              <div className="flex-1 py-1">
                                <p className="text-xs font-bold text-white">{c.deliverables.post}</p>
                                <p className="text-[9px] text-white/40">Post</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-white/50">No open campaigns right now.</p>
              )}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
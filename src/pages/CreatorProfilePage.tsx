import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Users,
  CalendarCheck,
  Loader2,
  AlertCircle,
  Gift,
  MessageCircle,
  BadgeCheck,
  ShieldCheck,
  Clock,
  Calendar,
  Globe2,
  Award,
  ThumbsUp,
  ChevronDown,
  LayoutDashboard,
  UserCircle,
  FileText,
  LogOut,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { PostsGrid } from '@/components/PostsGrid';
import { SendGiftModal } from '@/components/SendGiftModal';
import { SocialLinks } from '@/components/SocialLinks';
import { getCoverPhoto } from '@/utils/coverPhoto';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { postApi, type ApiPost } from '@/services/postApi';
import type { ApiSession } from '@/services/sessionApi';
import type { ApiReview } from '@/services/reviewApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/utils/cn';

const TABS = ['Overview', 'Portfolio', 'Live Sessions', 'Community', 'Reviews'] as const;
type Tab = (typeof TABS)[number];

export default function CreatorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<ApiCreator | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [projectsCompleted, setProjectsCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('Overview');
  const [bioExpanded, setBioExpanded] = useState(false);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const authUser = useAppSelector((s) => s.auth.user);
  const { logout } = useAuth();
  const isOwnProfile = Boolean(isAuthenticated && authUser && creator && authUser._id === creator.user._id);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await creatorApi.getBySlug(slug!);
        if (!cancelled) {
          setCreator(data.creator);
          setSessions(data.sessions);
          setReviews((data.reviews as ApiReview[]) || []);
          setProjectsCompleted(data.stats?.projectsCompletedCount ?? 0);
        }
        const creatorPosts = await postApi.getByCreator(data.creator._id);
        if (!cancelled) setPosts(creatorPosts);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleFollow = async () => {
    if (!isAuthenticated || !creator) return;
    const result = await creatorApi.follow(creator._id);
    setFollowing(result.following);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 pt-20 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading profile...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          {error ? <AlertCircle size={28} className="mx-auto mb-3 text-red-400" /> : null}
          <p className="text-white/60">{error || 'Creator not found.'}</p>
          <Link to="/" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400">
            <ArrowLeft size={15} /> Back to home
          </Link>
        </Container>
      </div>
    );
  }

  const categoryLabel = creator.category?.label ?? 'Creator';
  const memberSince = creator.createdAt
    ? new Date(creator.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;
  const visibleSkills = (creator.skills || []).slice(0, 5);
  const extraSkillCount = Math.max(0, (creator.skills?.length || 0) - visibleSkills.length);
  const isTopRated = creator.averageRating >= 4.5 && creator.reviewCount >= 20;

  return (
    <div className="pb-24">
      {/* Cover */}
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <img src={getCoverPhoto(categoryLabel, 1200, 400)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/30" />

        <div className="absolute inset-x-4 top-4 flex items-start justify-between sm:inset-x-6">
          <Link to="/explore" className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-sm hover:text-white">
            <ArrowLeft size={14} /> Back
          </Link>
          <div className="flex items-center gap-2">
            {creator.isAvailableForWork !== false && (
              <span className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-semibold text-emerald-300 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Available for Work
              </span>
            )}
            {creator.isTopCreator && (
              <span className="flex flex-col items-center rounded-xl bg-black/50 px-3 py-1.5 text-center backdrop-blur-sm">
                <span className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                  <Star size={11} fill="currentColor" /> Top Creator
                </span>
                <span className="text-[10px] text-white/50">{categoryLabel}</span>
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
          <div className="relative shrink-0">
            <img
              src={creator.user.avatarUrl || `https://i.pravatar.cc/300?u=${creator._id}`}
              alt={creator.user.name}
              className="h-24 w-24 rounded-full border-4 border-orange-500/70 object-cover shadow-lifted sm:h-28 sm:w-28"
            />
            {creator.isAvailableForWork !== false && (
              <span className="absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-[#0A0A0A] bg-emerald-400" />
            )}
          </div>

          <div className="flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{creator.user.name}</h1>
              <BadgeCheck size={20} className="fill-sky-500 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-sm text-white/50">@{creator.slug}</p>
            {creator.title && <p className="mt-1 text-white/80">{creator.title}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
              {creator.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={13} /> {creator.location}
                </span>
              )}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 pb-1 sm:w-auto">
            {isOwnProfile ? (
              <>
                <Link to="/dashboard/creator/edit" className="w-full sm:w-auto">
                  <Button className="w-full sm:w-auto">
                    <UserCircle size={15} /> Edit Profile
                  </Button>
                </Link>
                <Link to="/dashboard/creator" className="w-full sm:w-auto">
                  <Button variant="outline" className="w-full sm:w-auto">
                    <LayoutDashboard size={15} /> Dashboard
                  </Button>
                </Link>
                <div className="flex w-full items-center justify-between gap-2 sm:w-auto">
                  <Link to="/bookings" className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 sm:flex-none">
                    <CalendarCheck size={13} /> Bookings
                  </Link>
                  <Link to="/proposals" className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-xs font-semibold text-white/70 hover:bg-white/10 sm:flex-none">
                    <FileText size={13} /> Proposals
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/10 sm:flex-none"
                  >
                    <LogOut size={13} /> Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Button className="w-full sm:w-auto" onClick={handleFollow}>
                  {following ? 'Following' : 'Follow'}
                </Button>
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => navigate(`/messages?with=${creator.user._id}`)}>
                  <MessageCircle size={15} /> Message
                </Button>
                <button
                  onClick={() => setGiftOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full border border-fuchsia-500/40 px-6 py-3 text-sm font-semibold text-fuchsia-300 hover:bg-fuchsia-500/10 sm:w-auto"
                >
                  <Gift size={15} /> Send FanBox
                </button>
              </>
            )}
          </div>
        </motion.div>

        {/* Socials + follower counts */}
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <SocialLinks socials={creator.socials} className="flex gap-2" />
          <span className="text-sm text-white/50">
            <b className="text-white">{creator.followerCount.toLocaleString('en-IN')}</b> Followers
          </span>
        </div>

        {/* Trust stats strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-navy-800/50 p-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-300">
              <Star size={15} fill="currentColor" /> {creator.averageRating || '—'}
            </p>
            <p className="text-xs text-white/40">({creator.reviewCount}) Reviews</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{projectsCompleted}</p>
            <p className="text-xs text-white/40">Projects Completed</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-white">{creator.onTimeDeliveryPercent ?? 100}%</p>
            <p className="text-xs text-white/40">On-Time Delivery</p>
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
            <div className="space-y-10">
              <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                <div>
                  {creator.bio && (
                    <>
                      <h2 className="text-lg font-bold text-white">About {creator.user.name.split(' ')[0]}</h2>
                      <p className={cn('mt-2 max-w-2xl leading-relaxed text-white/70', !bioExpanded && 'line-clamp-3')}>{creator.bio}</p>
                      <button
                        onClick={() => setBioExpanded((v) => !v)}
                        className="mt-1 flex items-center gap-1 text-sm font-semibold text-orange-400 hover:underline"
                      >
                        {bioExpanded ? 'Read Less' : 'Read More'} <ChevronDown size={14} className={cn('transition-transform', bioExpanded && 'rotate-180')} />
                      </button>
                    </>
                  )}

                  {visibleSkills.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {visibleSkills.map((skill) => (
                        <span key={skill} className="rounded-full border border-white/10 bg-navy-800/60 px-3.5 py-1.5 text-xs font-semibold text-white/70">
                          {skill}
                        </span>
                      ))}
                      {extraSkillCount > 0 && (
                        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-navy-800/60 text-xs font-semibold text-white/50">
                          +{extraSkillCount}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Trust tiles */}
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {isTopRated && (
                      <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                        <Award size={20} className="mx-auto text-orange-400" />
                        <p className="mt-2 text-lg font-bold text-white">Top 5%</p>
                        <p className="text-[11px] text-white/40">Top Rated Creators</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                      <ShieldCheck size={20} className="mx-auto text-orange-400" />
                      <p className="mt-2 text-lg font-bold text-white">100%</p>
                      <p className="text-[11px] text-white/40">Payment Protected</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                      <Clock size={20} className="mx-auto text-orange-400" />
                      <p className="mt-2 text-lg font-bold text-white">{projectsCompleted}+</p>
                      <p className="text-[11px] text-white/40">Projects Completed</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-4 text-center">
                      <ThumbsUp size={20} className="mx-auto text-orange-400" />
                      <p className="mt-2 text-lg font-bold text-white">{creator.reviewCount}</p>
                      <p className="text-[11px] text-white/40">Positive Reviews</p>
                    </div>
                  </div>
                </div>

                <div className="h-fit rounded-2xl border border-white/10 bg-navy-800/50 p-5">
                  {memberSince && (
                    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-white/50"><Calendar size={14} /> Member Since</span>
                      <span className="font-semibold text-white">{memberSince}</span>
                    </div>
                  )}
                  {creator.responseTime && (
                    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-white/50"><Clock size={14} /> Response Time</span>
                      <span className="font-semibold text-white">{creator.responseTime}</span>
                    </div>
                  )}
                  {creator.languages && creator.languages.length > 0 && (
                    <div className="flex items-center justify-between border-b border-white/5 py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-white/50"><Globe2 size={14} /> Languages</span>
                      <span className="font-semibold text-white">{creator.languages.join(', ')}</span>
                    </div>
                  )}
                  {creator.location && (
                    <div className="flex items-center justify-between py-2.5 text-sm">
                      <span className="flex items-center gap-2 text-white/50"><MapPin size={14} /> Location</span>
                      <span className="font-semibold text-white">{creator.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {creator.portfolioImages?.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Featured Portfolio</h2>
                    <button onClick={() => setTab('Portfolio')} className="text-xs font-semibold text-orange-400 hover:underline">View All</button>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {creator.portfolioImages.slice(0, 4).map((img) => (
                      <div key={img} className="aspect-square overflow-hidden rounded-xl">
                        <img src={img} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sessions.length > 0 && (
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">Live Sessions</h2>
                    <button onClick={() => setTab('Live Sessions')} className="text-xs font-semibold text-orange-400 hover:underline">View All</button>
                  </div>
                  <div className="mt-4 flex gap-5 overflow-x-auto pb-3 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {sessions.slice(0, 4).map((session) => (
                      <ApiSessionCard key={session._id} session={session} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'Portfolio' && (
            <div>
              {creator.portfolioImages?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
                  {creator.portfolioImages.map((img, i) => (
                    <motion.div
                      key={img}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      className="aspect-square overflow-hidden rounded-xl"
                    >
                      <img src={img} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-110" />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No portfolio images yet.</p>
              )}
            </div>
          )}

          {tab === 'Live Sessions' && (
            <div>
              {sessions.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => (
                    <ApiSessionCard key={session._id} session={session} />
                  ))}
                </div>
              ) : (
                <p className="text-white/50">No live or upcoming sessions right now.</p>
              )}
            </div>
          )}

          {tab === 'Community' && (
            <div>
              {posts.length > 0 ? (
                <PostsGrid posts={posts} />
              ) : (
                <p className="text-white/50">No posts yet — check back soon.</p>
              )}
            </div>
          )}

          {tab === 'Reviews' && (
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((r) => (
                  <div key={r._id} className="rounded-2xl border border-white/10 bg-navy-800/50 p-5">
                    <div className="flex items-center gap-3">
                      {r.fromUser.avatarUrl ? (
                        <img src={r.fromUser.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                          {r.fromUser.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-white">{r.fromUser.name}</p>
                        <p className="flex items-center gap-1 text-xs text-yellow-300">
                          <Star size={11} fill="currentColor" /> {r.rating}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/70">{r.comment}</p>
                  </div>
                ))
              ) : (
                <p className="text-white/50">No reviews yet.</p>
              )}
            </div>
          )}
        </div>
      </Container>

      {creator && (
        <SendGiftModal creatorId={creator._id} creatorName={creator.user.name} open={giftOpen} onClose={() => setGiftOpen(false)} />
      )}
    </div>
  );
}
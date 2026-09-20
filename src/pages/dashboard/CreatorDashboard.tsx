import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { Wallet, Users, Eye, Star, TrendingUp, Loader2, AlertCircle, Plus, Video, Grid3x3, ArrowRight, ChevronRight, FileText, Sparkles, Calendar, CalendarClock, Megaphone, ShieldAlert, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
// TEMPORARY (Point 4, live marketplace not launched yet): using ComingSoonModal
// in place of CreateSessionModal below. To REVERT once Go Live is ready:
//   1. Change this import back to: import { CreateSessionModal } from '@/components/CreateSessionModal';
//   2. Undo the 3 other spots in this file tagged "REVERT-GO-LIVE" (search for that tag).
import { ComingSoonModal } from '@/components/ComingSoonModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PostsGrid } from '@/components/PostsGrid';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { RecommendedSessionCard } from '@/components/RecommendedSessionCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { creatorApi, type CreatorDashboardData, type ApiCreator } from '@/services/creatorApi';
import { postApi, type ApiPost, MAX_POSTS_PER_CREATOR } from '@/services/postApi';
import { sessionApi, type ApiSession } from '@/services/sessionApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { walletApi } from '@/services/walletApi';
import { campaignApi, type ApiProposal, type SuggestedCampaign } from '@/services/campaignApi';
import { subscriptionApi, type ApiUserSubscription } from '@/services/subscriptionApi';
import { getApiErrorMessage, getApiErrorCode } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { resolveIcon } from '@/utils/icons';
import { cn } from '@/utils/cn';

const toneClasses = {
  orange: 'bg-orange-500/15 text-orange-400',
  teal: 'bg-teal-500/15 text-teal-300',
  yellow: 'bg-yellow-400/15 text-yellow-300',
  navy: 'bg-white/10 text-white',
  red: 'bg-red-500/15 text-red-400',
  purple: 'bg-fuchsia-500/15 text-fuchsia-300',
  blue: 'bg-sky-500/15 text-sky-300',
};

const toneBorderClasses = {
  orange: 'border-l-orange-500',
  teal: 'border-l-teal-500',
  yellow: 'border-l-yellow-400',
  navy: 'border-l-white/30',
  red: 'border-l-red-500',
  purple: 'border-l-fuchsia-500',
  blue: 'border-l-sky-500',
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const PROPOSAL_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-400/15 text-yellow-300',
  accepted: 'bg-emerald-500/15 text-emerald-300',
  rejected: 'bg-red-500/15 text-red-300',
};

function canJoinNow(scheduledAt: string) {
  const diffMinutes = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
  return diffMinutes <= 10;
}

function computeProfileCompletion(profile: ApiCreator | null, hasAvatar: boolean) {
  if (!profile) return 0;
  const checks = [
    hasAvatar,
    Boolean(profile.title),
    Boolean(profile.bio),
    Boolean(profile.category),
    Boolean(profile.location),
    Boolean(profile.skills && profile.skills.length > 0),
    Boolean(
      profile.socials && (profile.socials.instagram || profile.socials.youtube || profile.socials.behance || profile.socials.website)
    ),
  ];
  const done = checks.filter(Boolean).length;
  return Math.round((done / checks.length) * 100);
}

// "Proposal Credits" card — how many proposals this cycle's plan allows,
// how many are used, how many are left, and when the cycle resets. If
// they've gone past their plan's included quota, shows how many extra
// (pay-per-proposal) sends they've made this cycle at the plan's rate —
// there's no separate "credit pack" concept, extras are simply charged
// from the wallet per send past the limit (see subscription.service.js).
function ProposalCreditsCard({ subscription }: { subscription: ApiUserSubscription }) {
  const { plan } = subscription;
  const limit = plan.proposalLimit;
  const used = subscription.proposalsUsedThisCycle;
  const remaining = limit == null ? null : Math.max(0, limit - used);
  const extraSent = limit == null ? 0 : Math.max(0, used - limit);
  const percentUsed = limit == null || limit === 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isFreePlan = plan.price === 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-card transition-all duration-300 ease-out hover:border-white/20">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-white/50">
          <FileText size={14} /> Proposal Credits
        </h2>
        <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300 ring-1 ring-inset ring-orange-500/20">{plan.name}</span>
      </div>

      {limit == null ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-emerald-300">
          <Sparkles size={14} /> Unlimited proposals this cycle
        </p>
      ) : (
        <>
          <p className="mt-3 text-2xl font-bold text-white">
            {remaining} <span className="text-sm font-semibold text-white/50">of {limit} left</span>
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentUsed}%` }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className={cn('h-full rounded-full', percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 75 ? 'bg-yellow-500' : 'bg-orange-500')}
            />
          </div>
          {extraSent > 0 && (
            <p className="mt-2 text-xs text-white/50">
              +{extraSent} extra sent this cycle at {formatRupees(plan.extraProposalCost)} each
            </p>
          )}
        </>
      )}

      <p className="mt-3 text-xs text-white/40">Resets on {formatDate(subscription.currentPeriodEnd)}</p>

      {isFreePlan && (
        <Link
          to="/pricing"
          className="group relative mt-4 flex w-full items-center justify-center overflow-hidden rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-400 hover:shadow-glow"
        >
          <span className="shine-sweep" />
          Upgrade for more proposals
        </Link>
      )}
    </div>
  );
}

// "Profile Strength" — a real radial gauge of the same `completion` % used
// site-wide (computeProfileCompletion), not a fabricated metric.
function ProfileStrengthCard({ completion }: { completion: number }) {
  const gaugeData = [{ value: completion, fill: 'url(#profileStrengthGradient)' }];

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Profile Strength</h2>
        <Link to="/dashboard/creator/edit" className="text-xs font-semibold text-orange-400 hover:underline">Edit</Link>
      </div>

      <div className="relative mx-auto mt-3 h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart innerRadius="72%" outerRadius="100%" data={gaugeData} startAngle={90} endAngle={-270}>
            <defs>
              <linearGradient id="profileStrengthGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FF5A1F" />
                <stop offset="100%" stopColor="#EC2A78" />
              </linearGradient>
            </defs>
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar background={{ fill: 'rgba(255,255,255,0.08)' }} dataKey="value" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-white">{completion}%</span>
          <span className="text-[11px] text-white/50">complete</span>
        </div>
      </div>

      {completion < 100 ? (
        <Link
          to="/dashboard/creator/edit"
          className="group relative mt-4 flex w-full items-center justify-center gap-1.5 overflow-hidden rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-400 hover:shadow-glow"
        >
          <span className="shine-sweep" />
          Complete Profile <ArrowRight size={14} />
        </Link>
      ) : (
        <p className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-emerald-300">
          🎉 Your profile is fully set up <ChevronRight size={14} />
        </p>
      )}
    </div>
  );
}

// Real category totals from the API (data.earningsBreakdown), rendered as a
// donut instead of a plain bar list — no fabricated figures.
const EARNINGS_COLORS = ['#FF5A1F', '#EC2A78', '#FFD65C', '#2DD4BF', '#38BDF8'];

function EarningsBreakdownCard({ breakdown, formatRupees }: { breakdown: { _id: string; total: number }[]; formatRupees: (paise: number) => string }) {
  const total = breakdown.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card">
      <div className="flex items-center gap-2">
        <TrendingUp size={16} className="text-teal-400" />
        <h2 className="text-lg font-bold text-white">Earnings breakdown</h2>
      </div>

      {breakdown.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">No earnings yet.</p>
      ) : (
        <div className="mt-4 flex items-center gap-5">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={breakdown} dataKey="total" nameKey="_id" innerRadius="65%" outerRadius="100%" paddingAngle={3} stroke="none">
                  {breakdown.map((_, i) => (
                    <Cell key={i} fill={EARNINGS_COLORS[i % EARNINGS_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-white">{formatRupees(total)}</span>
              <span className="text-[10px] text-white/40">total</span>
            </div>
          </div>
          <div className="min-w-0 flex-1 space-y-2.5">
            {breakdown.map((row, i) => {
              const pct = total ? Math.round((row.total / total) * 100) : 0;
              return (
                <div key={row._id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex min-w-0 items-center gap-1.5 truncate capitalize text-white/60">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: EARNINGS_COLORS[i % EARNINGS_COLORS.length] }} />
                    <span className="truncate">{row._id.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="shrink-0 font-bold text-white">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Shown while the creator's profile hasn't been submitted for review yet,
 * is pending admin approval, or was rejected — mirrors AgencyDashboard's
 * StatusGate so all three roles behave the same way. */
function StatusGate({ profile }: { profile: ApiCreator }) {
  if (profile.verificationStatus === 'unverified') {
    return (
      <div className="mx-auto max-w-md text-center">
        <ShieldAlert size={32} className="mx-auto text-yellow-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Finish your creator profile</h1>
        <p className="mt-2 text-sm text-white/60">Your account was created but your details weren't submitted for review yet.</p>
        <Link to="/dashboard/creator/edit">
          <Button className="mt-6">Complete Profile</Button>
        </Link>
      </div>
    );
  }

  if (profile.verificationStatus === 'pending') {
    return (
      <div className="mx-auto max-w-md text-center">
        <Clock size={32} className="mx-auto text-orange-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Waiting for admin approval</h1>
        <p className="mt-2 text-sm text-white/60">
          Your profile is in the review queue. You'll get full dashboard access once an admin approves it.
        </p>
      </div>
    );
  }

  if (profile.verificationStatus === 'rejected') {
    return (
      <div className="mx-auto max-w-md text-center">
        <AlertCircle size={32} className="mx-auto text-red-400" />
        <h1 className="mt-4 text-xl font-bold text-white">Application not approved</h1>
        {profile.rejectionReason && <p className="mt-2 text-sm text-white/60">Reason: {profile.rejectionReason}</p>}
        <p className="mt-2 text-sm text-white/60">Update your details and resubmit for another review.</p>
        <Link to="/dashboard/creator/edit">
          <Button className="mt-6">Edit &amp; Resubmit</Button>
        </Link>
      </div>
    );
  }

  return null;
}

export default function CreatorDashboard() {
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [profile, setProfile] = useState<ApiCreator | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [recommended, setRecommended] = useState<ApiSession[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const [appliedCampaigns, setAppliedCampaigns] = useState<ApiProposal[]>([]);
  const [suggestedCampaigns, setSuggestedCampaigns] = useState<SuggestedCampaign[] | null>(null);
  const [suggestionsLocked, setSuggestionsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // REVERT-GO-LIVE: was `const [createSessionOpen, setCreateSessionOpen] = useState(false);`
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    // REVERT-GO-LIVE: was `setCreateSessionOpen(true);` — deep link (?action=create-session)
    // into the real create-session flow once it's back.
    if (searchParams.get('action') === 'create-session') {
      setComingSoonOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadDashboard = () => {
    setLoading(true);
    creatorApi
      .getMyDashboard()
      .then((d) => {
        setData(d);
        return postApi.getByCreator(d.creatorId);
      })
      .then(setPosts)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));

    creatorApi.getMyProfile().then(setProfile).catch(() => setProfile(null));
    walletApi.getMy().then((w) => setWalletBalance(w.balance)).catch(() => setWalletBalance(null));
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
    subscriptionApi.getMySubscription().then(setMySubscription).catch(() => setMySubscription(null));
    campaignApi
      .getMyProposals()
      .then((d) => setAppliedCampaigns(d.proposals.filter((p) => p.campaign).slice(0, 5)))
      .catch(() => setAppliedCampaigns([]));
    campaignApi
      .getSuggested()
      .then((suggestions) => {
        setSuggestedCampaigns(suggestions);
        setSuggestionsLocked(false);
      })
      .catch((err) => {
        if (getApiErrorCode(err) === 'PRO_FEATURE_LOCKED') {
          setSuggestionsLocked(true);
        } else {
          setSuggestedCampaigns([]);
        }
      });
    sessionApi
      .list({ page: 1 })
      .then((d) => setRecommended(d.sessions.slice(0, 4)))
      .catch(() => setRecommended([]));
  };

  useEffect(loadDashboard, []);

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    await postApi.remove(deleteTarget);
    setPosts((prev) => prev.filter((p) => p._id !== deleteTarget));
    setDeleteTarget(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading your dashboard...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center text-white/60">
        <AlertCircle size={28} className="text-red-400" />
        <p className="text-sm">Couldn't load your dashboard — {error}</p>
      </div>
    );
  }

  if (profile && profile.verificationStatus && profile.verificationStatus !== 'verified') {
    return (
      <div className="flex min-h-[70vh] items-center pt-8">
        <Container>
          <StatusGate profile={profile} />
        </Container>
      </div>
    );
  }

  const STATS = [
    { icon: Users, label: 'Total followers', value: data.stats.followerCount.toLocaleString('en-IN'), tone: 'orange' as const },
    { icon: Eye, label: 'Profile views', value: data.stats.profileViews.toLocaleString('en-IN'), tone: 'red' as const },
    { icon: Wallet, label: 'Total earnings', value: formatRupees(data.stats.totalEarnings), tone: 'purple' as const },
    { icon: Star, label: 'Fanitt Score', value: data.stats.averageRating ? String(data.stats.averageRating) : '—', tone: 'blue' as const },
  ];

  const completion = computeProfileCompletion(profile, Boolean(user?.avatarUrl));

  return (
    <div className="pt-8 pb-14">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white sm:text-3xl">
              Welcome back, <span className="bg-gradient-to-r from-orange-400 via-pink-400 to-yellow-300 bg-clip-text text-transparent">{user?.name?.split(' ')[0]}</span>
              <motion.span
                animate={{ rotate: [0, 18, -8, 18, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
                className="inline-block origin-[70%_70%]"
              >
                👋
              </motion.span>
            </h1>
            <p className="mt-1 text-sm text-white/60">Ready to inspire, connect and grow today?</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/creator/edit"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-orange-400/50 hover:bg-orange-500/10 hover:text-orange-300 hover:shadow-card"
            >
              Edit Profile
            </Link>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover ring-2 ring-orange-500/30 ring-offset-2 ring-offset-[#0A0A0A] transition-transform duration-300 ease-out hover:scale-105" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-lg font-bold text-orange-300 ring-2 ring-orange-500/30 ring-offset-2 ring-offset-[#0A0A0A] transition-transform duration-300 ease-out hover:scale-105">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </motion.div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={cn('flex items-center gap-3.5 rounded-2xl border border-l-4 border-white/10 bg-navy-800/60 p-4 shadow-card sm:p-5', toneBorderClasses[stat.tone])}
            >
              <span className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-white/10', toneClasses[stat.tone])}>
                <stat.icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                {stat.value === '—' ? (
                  <p className="text-sm font-semibold leading-tight text-white/40">Not yet rated</p>
                ) : (
                  <p className="text-2xl font-bold leading-tight text-white">{stat.value}</p>
                )}
                <p className="text-xs text-white/50">{stat.label}</p>
              </div>
              <ChevronRight size={16} className="shrink-0 text-white/15" />
            </motion.div>
          ))}
        </div>

        {recommended.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Recommended for you</h2>
              <Link to="/sessions" className="text-xs font-semibold text-orange-400 hover:underline">View all</Link>
            </div>
            <div className="mt-4 flex gap-5 overflow-x-auto pb-3 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {recommended.map((session) => (
                <RecommendedSessionCard key={session._id} session={session} />
              ))}
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Trending Categories</h2>
              <Link to="/explore" className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline">
                Explore all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 8).map((cat, i) => {
                const Icon = resolveIcon(cat.icon);
                return (
                  <motion.div
                    key={cat._id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    whileHover={{ y: -2 }}
                  >
                    <Link
                      to={`/explore?category=${cat._id}`}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/60 px-4 py-2 text-sm font-semibold text-white/70 shadow-soft transition-all duration-200 ease-out hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-white hover:shadow-card"
                    >
                      <Icon size={15} className="text-orange-400" />
                      {cat.label}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Point 8: rule-based AI-suggested campaigns — Pro/Exclusive only.
            Locked state entices Lite users to upgrade instead of hiding
            the feature entirely. */}
        {(suggestionsLocked || (suggestedCampaigns && suggestedCampaigns.length > 0)) && (
          <div className="mt-8">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-orange-400" />
              <h2 className="text-lg font-bold text-white">AI-Suggested Campaigns</h2>
              <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-bold uppercase text-orange-300">Pro</span>
            </div>

            {suggestionsLocked ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-5 shadow-card">
                <div>
                  <p className="font-bold text-white">Unlock personalized campaign matches</p>
                  <p className="mt-1 text-sm text-white/60">Upgrade to Pro to see campaigns picked for your category, location and skills.</p>
                </div>
                <Link to="/pricing" className="group relative shrink-0 overflow-hidden rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-400 hover:shadow-glow">
                  <span className="shine-sweep" />
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-3 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(suggestedCampaigns || []).map(({ campaign, matchReasons }) => (
                  <Link
                    key={campaign._id}
                    to={`/campaigns/${campaign._id}`}
                    className="w-72 shrink-0 rounded-2xl border border-white/10 bg-navy-800/60 p-4 shadow-soft transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-400/40 hover:shadow-card"
                  >
                    <p className="truncate text-sm font-bold text-white">{campaign.title}</p>
                    <p className="mt-1 text-xs text-white/50">{campaign.brand.companyName}</p>
                    <p className="mt-2 text-sm font-semibold text-orange-300">
                      {campaign.campaignType === 'paid' ? formatRupees(campaign.budget) : `${campaign.products.length} product(s)`}
                    </p>
                    {matchReasons.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {matchReasons.slice(0, 2).map((reason, i) => (
                          <span key={i} className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile completion now lives in the "Profile Strength" panel in
            the right column (a proper radial gauge) — see below — instead
            of a separate full-width banner duplicating the same number. */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card transition-all duration-300 ease-out hover:border-white/20"
            >
              <CalendarClock size={96} className="pointer-events-none absolute -bottom-4 -right-4 text-white/[0.04]" strokeWidth={1} />
              <h2 className="relative flex items-center gap-2 text-lg font-bold text-white">
                <Calendar size={17} className="text-orange-400" /> Upcoming bookings
              </h2>
              {data.upcomingSessions.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">No upcoming sessions — create one to get started.</p>
              ) : (
                <div className="mt-4 divide-y divide-white/10">
                  {data.upcomingSessions.map((s) => (
                    <div key={s._id} className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors duration-200 hover:bg-white/[0.04]">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{s.title}</p>
                        <p className="text-xs text-white/50">
                          {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      {canJoinNow(s.scheduledAt) ? (
                        <button
                          onClick={() => navigate(`/sessions/${s._id}/live`)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white shadow-soft transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-card"
                        >
                          <Video size={13} /> Go Live
                        </button>
                      ) : (
                        <span className={`shrink-0 text-sm font-bold ${s.type === 'free' ? 'text-teal-400' : 'text-orange-400'}`}>
                          {s.type === 'free' ? 'Free' : formatRupees(s.price)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card transition-all duration-300 ease-out hover:border-white/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-bold text-white">
                  <Megaphone size={17} className="text-orange-400" /> Applied Campaigns
                </h2>
                <Link to="/proposals" className="text-xs font-semibold text-orange-400 hover:underline">View all</Link>
              </div>
              {appliedCampaigns.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">You haven't applied to any campaigns yet — browse open campaigns to send your first proposal.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[440px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wide text-white/40">
                        <th className="pb-3 pr-4 font-bold">Campaign</th>
                        <th className="pb-3 pr-4 font-bold">Brand</th>
                        <th className="pb-3 pr-4 font-bold">Applied</th>
                        <th className="pb-3 pr-4 text-right font-bold">Status</th>
                        <th className="w-6 pb-3" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {appliedCampaigns.map((p) => (
                        <tr
                          key={p._id}
                          onClick={() => navigate(`/campaigns/${p.campaign._id}`)}
                          className="group cursor-pointer transition-colors duration-200 hover:bg-white/[0.04]"
                        >
                          <td className="max-w-[180px] py-3 pr-4">
                            <span className="flex items-center gap-3">
                              <img
                                src={p.campaign.campaignImageUrl}
                                alt=""
                                className="h-9 w-9 shrink-0 rounded-lg object-cover ring-1 ring-inset ring-white/10"
                              />
                              <span className="truncate font-semibold text-white transition-colors group-hover:text-orange-300">
                                {p.campaign.title}
                              </span>
                            </span>
                          </td>
                          <td className="truncate py-3 pr-4 text-white/60">{p.campaign.brand.companyName}</td>
                          <td className="whitespace-nowrap py-3 pr-4 text-white/50">{formatDate(p.createdAt)}</td>
                          <td className="py-3 pr-4 text-right">
                            <span className={cn('inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize', PROPOSAL_STATUS_STYLES[p.status] || 'bg-white/10 text-white/60')}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3">
                            <ChevronRight size={16} className="text-white/20 transition-colors group-hover:text-orange-400" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="rounded-2xl border border-white/10 bg-navy-800/60 p-6 shadow-card transition-all duration-300 ease-out hover:border-white/20"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Your posts</h2>
                <span className="text-xs text-white/50">{posts.length}/{MAX_POSTS_PER_CREATOR} used</span>
              </div>
              {posts.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">No posts yet — share a photo or reel to appear on your profile.</p>
              ) : (
                <div className="mt-4">
                  <PostsGrid posts={posts} onDelete={setDeleteTarget} />
                </div>
              )}
            </motion.div>
          </div>

          <div className="space-y-6">
            <ProfileStrengthCard completion={completion} />
            {mySubscription && <ProposalCreditsCard subscription={mySubscription} />}

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-card transition-all duration-300 ease-out hover:border-white/20">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Quick Actions</h2>
              <div className="mt-3 space-y-1">
                {/* REVERT-GO-LIVE: onClick was `() => setCreateSessionOpen(true)` — swap back
                    when the live marketplace launches. */}
                <button
                  onClick={() => setComingSoonOpen(true)}
                  className="group flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-200 hover:bg-white/[0.05]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400 ring-1 ring-inset ring-red-500/20 transition-transform duration-300 ease-out group-hover:scale-110"><Video size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Go Live</span>
                    <span className="block text-xs text-white/40">Start your live session</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-orange-400" />
                </button>
                <button
                  onClick={() => setCreatePostOpen(true)}
                  disabled={posts.length >= MAX_POSTS_PER_CREATOR}
                  className="group flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-200 hover:bg-white/[0.05] disabled:opacity-40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-inset ring-fuchsia-500/20 transition-transform duration-300 ease-out group-hover:scale-110"><Grid3x3 size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Create Post</span>
                    <span className="block text-xs text-white/40">Share an update ({posts.length}/{MAX_POSTS_PER_CREATOR})</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-orange-400" />
                </button>
                <Link to="/dashboard/creator/analytics" className="group flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition-colors duration-200 hover:bg-white/[0.05]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-300 ring-1 ring-inset ring-sky-500/20 transition-transform duration-300 ease-out group-hover:scale-110"><TrendingUp size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">View Analytics</span>
                    <span className="block text-xs text-white/40">Track your performance</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-orange-400" />
                </Link>
              </div>
            </div>

            {walletBalance !== null && (
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 p-5 shadow-card transition-all duration-300 ease-out hover:border-orange-500/20">
                <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Wallet Balance</h2>
                  <Link to="/wallet" className="text-xs font-semibold text-orange-400 hover:underline">View wallet</Link>
                </div>
                <p className="relative mt-2 bg-gradient-to-r from-orange-400 to-yellow-300 bg-clip-text text-2xl font-bold text-transparent">{formatRupees(walletBalance)}</p>
                <Link
                  to="/wallet"
                  className="relative mt-4 flex w-full items-center justify-center overflow-hidden rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-orange-400 hover:shadow-glow"
                >
                  <span className="shine-sweep" />
                  Withdraw
                </Link>
              </div>
            )}

            <EarningsBreakdownCard breakdown={data.earningsBreakdown} formatRupees={formatRupees} />
          </div>
        </div>
      </Container>

      {/* REVERT-GO-LIVE: was
          <CreateSessionModal open={createSessionOpen} onClose={() => setCreateSessionOpen(false)} onCreated={loadDashboard} />
          Swap this ComingSoonModal line back to that when re-enabling Go Live. */}
      <ComingSoonModal open={comingSoonOpen} onClose={() => setComingSoonOpen(false)} />
      <CreatePostModal open={createPostOpen} onClose={() => setCreatePostOpen(false)} onCreated={loadDashboard} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete this post?"
        description="This will remove it from your profile permanently."
        confirmLabel="Delete"
        danger
        onConfirm={handleDeletePost}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
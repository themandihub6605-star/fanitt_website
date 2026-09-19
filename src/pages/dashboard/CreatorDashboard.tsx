import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Users, Eye, Star, TrendingUp, Loader2, AlertCircle, Plus, Video, Grid3x3, ArrowRight, ChevronRight, FileText, Sparkles } from 'lucide-react';
import { Container } from '@/components/ui/Container';
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
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-white/50">
          <FileText size={14} /> Proposal Credits
        </h2>
        <span className="rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300">{plan.name}</span>
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
            <div
              className={cn('h-full rounded-full', percentUsed >= 100 ? 'bg-red-500' : percentUsed >= 75 ? 'bg-yellow-500' : 'bg-orange-500')}
              style={{ width: `${percentUsed}%` }}
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
          className="mt-4 flex w-full items-center justify-center rounded-full bg-orange-500 py-2.5 text-sm font-semibold text-white hover:bg-orange-400"
        >
          Upgrade for more proposals
        </Link>
      )}
    </div>
  );
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

  const STATS = [
    { icon: Users, label: 'Total followers', value: data.stats.followerCount.toLocaleString('en-IN'), tone: 'orange' as const },
    { icon: Eye, label: 'Profile views', value: data.stats.profileViews.toLocaleString('en-IN'), tone: 'red' as const },
    { icon: Wallet, label: 'Total earnings', value: formatRupees(data.stats.totalEarnings), tone: 'purple' as const },
    { icon: Star, label: 'Fanitt Score', value: data.stats.averageRating ? String(data.stats.averageRating) : '—', tone: 'blue' as const },
  ];

  const completion = computeProfileCompletion(profile, Boolean(user?.avatarUrl));

  return (
    <div className="pt-8 pb-10">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="mt-1 text-sm text-white/60">Ready to inspire, connect and grow today?</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/dashboard/creator/edit" className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/80 hover:border-orange-400 hover:text-orange-300">
              Edit Profile
            </Link>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-lg font-bold text-orange-300">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="rounded-2xl border border-white/10 bg-navy-800/60 p-5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}>
                <stat.icon size={17} />
              </span>
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
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
              <Link to="/explore" className="text-xs font-semibold text-orange-400 hover:underline">Explore all</Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {categories.slice(0, 8).map((cat) => {
                const Icon = resolveIcon(cat.icon);
                return (
                  <Link
                    key={cat._id}
                    to={`/explore?category=${cat._id}`}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/60 px-4 py-2 text-sm font-semibold text-white/70 hover:border-orange-400/40 hover:text-white"
                  >
                    <Icon size={15} className="text-orange-400" />
                    {cat.label}
                  </Link>
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
              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-5">
                <div>
                  <p className="font-bold text-white">Unlock personalized campaign matches</p>
                  <p className="mt-1 text-sm text-white/60">Upgrade to Pro to see campaigns picked for your category, location and skills.</p>
                </div>
                <Link to="/pricing" className="shrink-0 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600">
                  Upgrade to Pro
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex gap-4 overflow-x-auto pb-3 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(suggestedCampaigns || []).map(({ campaign, matchReasons }) => (
                  <Link
                    key={campaign._id}
                    to={`/campaigns/${campaign._id}`}
                    className="w-72 shrink-0 rounded-2xl border border-white/10 bg-navy-800/60 p-4 transition-colors hover:border-orange-400/40"
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

        {completion < 100 && (
          <Link
            to="/dashboard/creator/edit"
            className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-pink-500/10 p-5"
          >
            <div>
              <p className="font-bold text-white">Complete your profile and get discovered</p>
              <p className="mt-1 text-sm text-white/60">Add your social links, bio and profile banner to increase your reach.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-4 border-orange-500/30">
                <span className="text-sm font-bold text-white">{completion}%</span>
              </div>
              <span className="flex items-center gap-1 rounded-full border border-orange-400/40 px-4 py-2 text-sm font-semibold text-orange-300">
                Complete Profile <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
              <h2 className="text-lg font-bold text-white">Upcoming bookings</h2>
              {data.upcomingSessions.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">No upcoming sessions — create one to get started.</p>
              ) : (
                <div className="mt-4 divide-y divide-white/10">
                  {data.upcomingSessions.map((s) => (
                    <div key={s._id} className="flex items-center gap-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{s.title}</p>
                        <p className="text-xs text-white/50">
                          {new Date(s.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                      </div>
                      {canJoinNow(s.scheduledAt) ? (
                        <button
                          onClick={() => navigate(`/sessions/${s._id}/live`)}
                          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600"
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
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Applied Campaigns</h2>
                <Link to="/proposals" className="text-xs font-semibold text-orange-400 hover:underline">View all</Link>
              </div>
              {appliedCampaigns.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">You haven't applied to any campaigns yet — browse open campaigns to send your first proposal.</p>
              ) : (
                <div className="mt-4 divide-y divide-white/10">
                  {appliedCampaigns.map((p) => (
                    <Link
                      key={p._id}
                      to={`/campaigns/${p.campaign._id}`}
                      className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3.5 transition-colors hover:bg-navy-800/45"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">{p.campaign.title}</p>
                        <p className="text-xs text-white/50">{p.campaign.brand.companyName} · {formatDate(p.createdAt)}</p>
                      </div>
                      <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize', PROPOSAL_STATUS_STYLES[p.status] || 'bg-white/10 text-white/60')}>
                        {p.status}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
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
            </div>
          </div>

          <div className="space-y-6">
            {mySubscription && <ProposalCreditsCard subscription={mySubscription} />}

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Quick Actions</h2>
              <div className="mt-3 space-y-1">
                {/* REVERT-GO-LIVE: onClick was `() => setCreateSessionOpen(true)` — swap back
                    when the live marketplace launches. */}
                <button
                  onClick={() => setComingSoonOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.03]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400"><Video size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Go Live</span>
                    <span className="block text-xs text-white/40">Start your live session</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30" />
                </button>
                <button
                  onClick={() => setCreatePostOpen(true)}
                  disabled={posts.length >= MAX_POSTS_PER_CREATOR}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.03] disabled:opacity-40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-500/15 text-fuchsia-300"><Grid3x3 size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Create Post</span>
                    <span className="block text-xs text-white/40">Share an update ({posts.length}/{MAX_POSTS_PER_CREATOR})</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30" />
                </button>
                <Link to="/dashboard/creator/analytics" className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.03]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"><TrendingUp size={17} /></span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">View Analytics</span>
                    <span className="block text-xs text-white/40">Track your performance</span>
                  </span>
                  <ChevronRight size={16} className="text-white/30" />
                </Link>
              </div>
            </div>

            {walletBalance !== null && (
              <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Wallet Balance</h2>
                  <Link to="/wallet" className="text-xs font-semibold text-orange-400 hover:underline">View wallet</Link>
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{formatRupees(walletBalance)}</p>
               <Link
  to="/wallet"
  className="mt-4 flex w-full items-center justify-center rounded-full py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-400"
>
  Withdraw
</Link>
              </div>
            )}

            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-6">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-teal-400" />
                <h2 className="text-lg font-bold text-white">Earnings breakdown</h2>
              </div>
              {data.earningsBreakdown.length === 0 ? (
                <p className="mt-4 text-sm text-white/50">No earnings yet.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {data.earningsBreakdown.map((row) => {
                    const total = data.earningsBreakdown.reduce((sum, r) => sum + r.total, 0) || 1;
                    const pct = Math.round((row.total / total) * 100);
                    return (
                      <div key={row._id}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="capitalize text-white/60">{row._id.replace(/_/g, ' ')}</span>
                          <span className="font-bold text-white">{formatRupees(row.total)}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,#FF6A1F,#EC2A78)]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
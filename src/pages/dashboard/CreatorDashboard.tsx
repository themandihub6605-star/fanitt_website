import { useEffect, useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Users, Eye, Star, TrendingUp, Loader2, AlertCircle, Plus, Video, Grid3x3, ArrowRight, ChevronRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CreateSessionModal } from '@/components/CreateSessionModal';
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
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { resolveIcon } from '@/utils/icons';

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

function canJoinNow(scheduledAt: string) {
  const diffMinutes = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
  return diffMinutes <= 10;
}

// Real completeness check based on the creator's own saved profile fields —
// no fake/random percentage.
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

export default function CreatorDashboard() {
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [profile, setProfile] = useState<ApiCreator | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [recommended, setRecommended] = useState<ApiSession[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create-session') {
      setCreateSessionOpen(true);
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

        {/* Recommended for you */}
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

        {/* Trending categories */}
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

        {/* Complete profile banner */}
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
            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wide text-white/50">Quick Actions</h2>
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => setCreateSessionOpen(true)}
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
                <Link to="/wallet" className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-white/[0.03]">
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
                  className="mt-4 flex w-full items-center justify-center rounded-full py-2.5 text-sm font-semibold text-white bg-[linear-gradient(135deg,#FF6A1F_0%,#F9436E_60%,#EC2A78_100%)]"
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

      <CreateSessionModal open={createSessionOpen} onClose={() => setCreateSessionOpen(false)} onCreated={loadDashboard} />
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
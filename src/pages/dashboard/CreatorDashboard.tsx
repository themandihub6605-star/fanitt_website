import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wallet, Users, Star, Calendar, TrendingUp, Loader2, AlertCircle, Plus, Video, Grid3x3 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { CreateSessionModal } from '@/components/CreateSessionModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { PostsGrid } from '@/components/PostsGrid';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { creatorApi, type CreatorDashboardData } from '@/services/creatorApi';
import { postApi, type ApiPost, MAX_POSTS_PER_CREATOR } from '@/services/postApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

const toneClasses = {
  orange: 'bg-orange-500/15 text-orange-400',
  teal: 'bg-teal-500/15 text-teal-300',
  yellow: 'bg-yellow-400/15 text-yellow-300',
  navy: 'bg-white/10 text-white',
};

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function canJoinNow(scheduledAt: string) {
  const diffMinutes = (new Date(scheduledAt).getTime() - Date.now()) / 60000;
  return diffMinutes <= 10;
}

export default function CreatorDashboard() {
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const user = useAppSelector((s) => s.auth.user);
  const navigate = useNavigate();

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
    { icon: Wallet, label: 'This month', value: formatRupees(data.stats.thisMonthEarnings), tone: 'orange' as const },
    { icon: Calendar, label: 'Upcoming sessions', value: String(data.upcomingSessions.length), tone: 'teal' as const },
    { icon: Users, label: 'Followers', value: data.stats.followerCount.toLocaleString('en-IN'), tone: 'yellow' as const },
    { icon: Star, label: 'Rating', value: data.stats.averageRating ? String(data.stats.averageRating) : '—', tone: 'navy' as const },
  ];

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/20 text-lg font-bold text-orange-300">
                {user?.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white sm:text-3xl">Creator Dashboard</h1>
              <p className="text-sm text-white/60">Welcome back, {user?.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setCreatePostOpen(true)} disabled={posts.length >= MAX_POSTS_PER_CREATOR}>
              <Grid3x3 size={16} /> New post ({posts.length}/{MAX_POSTS_PER_CREATOR})
            </Button>
            <Button onClick={() => setCreateSessionOpen(true)}>
              <Plus size={16} /> Create session
            </Button>
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
              className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneClasses[stat.tone]}`}>
                <stat.icon size={17} />
              </span>
              <p className="mt-4 text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-6">
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
                        <div className="h-1.5 rounded-full bg-orange-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.05] p-6">
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
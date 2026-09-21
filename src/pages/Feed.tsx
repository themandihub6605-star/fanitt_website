import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Home, Users2, Compass, UserSearch, Flame, Radio, MessageSquare, Crown, ArrowRight, Image as ImageIcon, Video as VideoIcon, Tag, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { FeedPostCard } from '@/components/FeedPostCard';
import { CreatePostModal } from '@/components/CreatePostModal';
import { postApi, type ApiPost } from '@/services/postApi';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { CATEGORIES } from '@/constants/content';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { resolveIcon } from '@/utils/icons';

// Recommended-creators card — real data (creatorApi.list), same follow
// action already wired on the post cards, just surfaced here too.
function RecommendedCreators() {
  const [creators, setCreators] = useState<ApiCreator[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    creatorApi
      .list({ limit: 8 })
      .then((d) => setCreators(d.creators.filter((c) => c.user).slice(0, 5)))
      .catch(() => setCreators([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFollow = async (creator: ApiCreator) => {
    try {
      const result = await creatorApi.follow(creator._id);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        if (result.following) next.add(creator._id);
        else next.delete(creator._id);
        return next;
      });
    } catch {
      // non-critical
    }
  };

  if (!loading && creators.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white">Recommended Creators</h2>
        <Link to="/explore" className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline">
          See All <ArrowRight size={11} />
        </Link>
      </div>
      {loading ? (
        <div className="mt-4 flex justify-center py-4"><Loader2 size={18} className="animate-spin text-white/30" /></div>
      ) : (
        <div className="mt-3 space-y-3">
          {creators.map((c) => (
            <div key={c._id} className="flex items-center gap-2.5">
              <Link to={`/creator/${c.slug}`} className="shrink-0">
                <img
                  src={c.user.avatarUrl || `https://i.pravatar.cc/100?u=${c._id}`}
                  alt={c.user.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              </Link>
              <Link to={`/creator/${c.slug}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{c.user.name}</p>
                <p className="truncate text-xs text-white/40">{c.title || c.category?.label}</p>
              </Link>
              {!followingIds.has(c._id) && (
                <button
                  onClick={() => handleFollow(c)}
                  className="shrink-0 rounded-full border border-orange-400/60 px-3 py-1.5 text-xs font-bold text-orange-300 transition-colors hover:bg-orange-500/10"
                >
                  Follow
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Feed() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const authUser = useAppSelector((s) => s.auth.user);

  // Shared across every card in this Feed — following a creator on one of
  // their posts instantly reflects on every other post of theirs on this
  // page too, instead of each card tracking its own disconnected state.
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const loadFeed = () => {
    setLoading(true);
    postApi
      .getFeed(50)
      .then(setPosts)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(loadFeed, []);

  // Everyone's posts show here, including your own — no self-post filter.
  const visiblePosts = posts;

  const handleFollowChange = (creatorId: string, following: boolean) => {
    setFollowingIds((prev) => {
      const next = new Set(prev);
      if (following) next.add(creatorId);
      else next.delete(creatorId);
      return next;
    });
  };

  return (
    <div className="pt-24 pb-24 sm:pt-28">
      <Container className="!px-0 sm:!px-gutter">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)_300px] lg:items-start lg:gap-6 xl:grid-cols-[240px_minmax(0,1fr)_320px]">
          {/* ───────── Left sidebar (desktop only — mobile already has MobileTabBar for this) ───────── */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto lg:block">
            <nav className="space-y-1">
              <Link to="/feed" className="flex items-center gap-3 rounded-xl bg-orange-500/15 px-3 py-2.5 text-sm font-bold text-orange-300">
                <Home size={17} /> Home
              </Link>
              <Link to="/explore" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                <Users2 size={17} /> Following
              </Link>
              <Link to="/explore" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                <Compass size={17} /> Discover
              </Link>
            </nav>

            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-white/30">Explore</p>
              <nav className="space-y-1">
                <Link to="/explore" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  <UserSearch size={17} /> Creators
                </Link>
                <a href="#categories" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  <Flame size={17} /> Trending
                </a>
                <Link to="/sessions" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  <Radio size={17} /> Live Sessions
                </Link>
                <Link to="/messages" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5 hover:text-white">
                  <MessageSquare size={17} /> Messages
                </Link>
              </nav>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wide text-white/30">For You</p>
              <div className="flex flex-wrap gap-2 px-3">
                {CATEGORIES.slice(0, 6).map((c) => (
                  <Link
                    key={c.label}
                    to={`/explore?category=${c.label}`}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:border-orange-400/40 hover:text-orange-300"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/pricing"
              className="group block overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-pink-500/10 p-4 transition-all duration-300 ease-out hover:border-orange-400/50"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300"><Crown size={16} /></span>
              <p className="mt-2.5 text-sm font-bold text-white">Go Pro</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">Unlock exclusive content, more reach &amp; premium tools.</p>
              <span className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-300">
                Upgrade Now <ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </aside>

          {/* ───────── Center feed ───────── */}
          <div className="mx-auto w-full min-w-0 max-w-xl lg:mx-0 lg:max-w-2xl">
            {authUser && (authUser.role === 'creator' || authUser.role === 'brand') && (
              <button
                onClick={() => setComposerOpen(true)}
                className="mb-4 hidden w-full items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/60 px-4 py-3 text-left shadow-card transition-colors hover:border-orange-400/30 lg:flex"
              >
                {authUser.avatarUrl ? (
                  <img src={authUser.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300">
                    {authUser.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="flex-1 text-sm text-white/40">What's on your mind?</span>
                <ImageIcon size={17} className="text-white/30" />
                <VideoIcon size={17} className="text-white/30" />
                <Tag size={17} className="text-white/30" />
                <span className="flex items-center gap-1 rounded-full bg-orange-500 px-4 py-1.5 text-xs font-bold text-white">
                  <Plus size={12} /> Post
                </span>
              </button>
            )}

            {loading && (
              <div className="flex flex-col items-center gap-3 py-16 text-white/50">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm">Loading feed...</p>
              </div>
            )}

            {!loading && error && (
              <div className="flex flex-col items-center gap-3 py-16 text-center text-white/60">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && visiblePosts.length === 0 && (
              <p className="py-16 text-center text-white/50">No posts yet — check back once creators start sharing.</p>
            )}

            {!loading && !error && visiblePosts.length > 0 && (
              <div className="mt-2 divide-y divide-white/10 border-y border-white/10 sm:mt-0 sm:divide-y-0 sm:border-none sm:space-y-4">
                {visiblePosts.map((post, i) => {
                  const creatorId = typeof post.creator === 'object' ? post.creator._id : null;
                  return (
                    <motion.div
                      key={post._id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.05 }}
                    >
                      <FeedPostCard
                        post={post}
                        isFollowing={creatorId ? followingIds.has(creatorId) : false}
                        onFollowChange={handleFollowChange}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ───────── Right sidebar (desktop only) ───────── */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto lg:block">
            <RecommendedCreators />

            <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-pink-500/5 p-4 shadow-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-300"><Crown size={16} /></span>
              <p className="mt-2.5 text-sm font-bold text-white">Create. Grow. Get Paid.</p>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Join <span className="font-semibold text-orange-300">Fanitt Pro</span> and unlock exclusive features, higher earnings and more opportunities.
              </p>
              <Link
                to="/pricing"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-orange-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-400"
              >
                Upgrade to Pro <ArrowRight size={14} />
              </Link>
            </div>

            {/* Real category chips, in place of a "trending tags" cloud —
                there's no hashtag/engagement-count system in the backend
                yet, so this points at real categories instead of numbers
                that would have to be invented. */}
            <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4 shadow-card">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <Flame size={14} className="text-orange-400" /> Explore Categories
                </h2>
                <Link to="/explore" className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:underline">
                  See All <ArrowRight size={11} />
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CATEGORIES.slice(0, 6).map((c) => {
                  const Icon = resolveIcon(c.icon);
                  return (
                    <Link
                      key={c.label}
                      to={`/explore?category=${c.label}`}
                      className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/60 transition-colors hover:bg-orange-500/10 hover:text-orange-300"
                    >
                      <Icon size={11} /> {c.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </Container>

      <CreatePostModal open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={loadFeed} />
    </div>
  );
}
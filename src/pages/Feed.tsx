import { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Container } from '@/components/ui/Container';
import { FeedPostCard } from '@/components/FeedPostCard';
import { postApi, type ApiPost } from '@/services/postApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

export default function Feed() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const authUser = useAppSelector((s) => s.auth.user);

  // Shared across every card in this Feed — following a creator on one of
  // their posts instantly reflects on every other post of theirs on this
  // page too, instead of each card tracking its own disconnected state.
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    postApi
      .getFeed(50)
      .then(setPosts)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiblePosts = authUser
    ? posts.filter((p) => typeof p.creator === 'string' || String(p.creator.user._id) !== String(authUser._id))
    : posts;

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
      <Container className="max-w-xl !px-0 sm:!px-gutter">
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
      </Container>
    </div>
  );
}
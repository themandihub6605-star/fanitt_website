import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Rss } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { FeedPostCard } from '@/components/FeedPostCard';
import { postApi, type ApiPost } from '@/services/postApi';
import { getApiErrorMessage } from '@/services/apiClient';

export default function Feed() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    postApi
      .getFeed(50)
      .then(setPosts)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-24 pb-24">
      <Container className="max-w-xl">
        <div className="mb-8 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
            <Rss size={20} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-white">Feed</h1>
            <p className="text-xs text-white/50">Fresh photos & reels from creators you follow and beyond</p>
          </div>
        </div>

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

        {!loading && !error && posts.length === 0 && (
          <p className="py-16 text-center text-white/50">No posts yet — check back once creators start sharing.</p>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="space-y-6">
            {posts.map((post, i) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: Math.min(i, 5) * 0.05 }}
              >
                <FeedPostCard post={post} />
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
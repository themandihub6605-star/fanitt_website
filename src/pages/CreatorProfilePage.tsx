import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, MapPin, Users, CalendarCheck, Loader2, AlertCircle, Gift, MessageCircle } from 'lucide-react';
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
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

export default function CreatorProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<ApiCreator | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

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

  const categoryLabel = creator.category?.label ?? 'Business Coaching';

  return (
    <div className="pb-24">
      <div className="relative h-56 w-full overflow-hidden sm:h-72">
        <img src={getCoverPhoto(categoryLabel, 1200, 400)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b16] via-[#080b16]/60 to-[#080b16]/40" />
      </div>

      <Container className="relative -mt-20 sm:-mt-24">
        <Link to="/" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start gap-6 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:flex-row sm:items-end sm:p-8"
        >
          <img
            src={creator.user.avatarUrl || `https://i.pravatar.cc/300?u=${creator._id}`}
            alt={creator.user.name}
            className="h-28 w-28 shrink-0 rounded-2xl border-4 border-[#0d1120] object-cover shadow-lifted sm:h-32 sm:w-32"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{creator.user.name}</h1>
              {creator.averageRating > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-yellow-400/15 px-2.5 py-1 text-xs font-bold text-yellow-300">
                  <Star size={12} fill="currentColor" /> {creator.averageRating} ({creator.reviewCount})
                </span>
              )}
            </div>
            <p className="mt-1 text-white/70">{categoryLabel}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {creator.followerCount.toLocaleString('en-IN')} followers
              </span>
              {creator.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {creator.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarCheck size={14} /> {sessions.length} sessions live
              </span>
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <div className="flex w-full gap-2 sm:w-auto">
              <Button className="flex-1 sm:flex-none" onClick={handleFollow}>
                {following ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setGiftOpen(true)}>
                <Gift size={15} /> Gift
              </Button>
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => navigate(`/messages?with=${creator.user._id}`)}
              >
                <MessageCircle size={15} /> Message
              </Button>
            </div>
            <SocialLinks socials={creator.socials} className="flex gap-2" />
          </div>
        </motion.div>

        {creator.bio && (
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-8 max-w-2xl leading-relaxed text-white/70"
          >
            {creator.bio}
          </motion.p>
        )}

        {creator.portfolioImages && creator.portfolioImages.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white">Portfolio</h2>
            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
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
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-bold text-white">Posts</h2>
            <div className="mt-4">
              <PostsGrid posts={posts} />
            </div>
          </div>
        )}

        {sessions.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-bold text-white">Live & upcoming sessions</h2>
            <div className="mt-4 flex gap-5 overflow-x-auto pb-3 pr-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sessions.map((session) => (
                <ApiSessionCard key={session._id} session={session} />
              ))}
            </div>
          </div>
        )}
      </Container>

      {creator && (
        <SendGiftModal creatorId={creator._id} creatorName={creator.user.name} open={giftOpen} onClose={() => setGiftOpen(false)} />
      )}
    </div>
  );
}
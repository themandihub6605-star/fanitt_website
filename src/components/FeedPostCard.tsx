import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX, Play, Pause, BadgeCheck } from 'lucide-react';
import { postApi, type ApiPost } from '@/services/postApi';
import { creatorApi } from '@/services/creatorApi';
import { getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

export function FeedPostCard({ post, compact = false }: { post: ApiPost; compact?: boolean }) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [following, setFollowing] = useState(false);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [justLiked, setJustLiked] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const creator = typeof post.creator === 'object' ? post.creator : null;

  useEffect(() => {
    if (user) setLiked(post.likedBy.includes(user._id));
  }, [user, post.likedBy]);

  useEffect(() => {
    if (post.mediaType !== 'video' || !itemRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(itemRef.current);
    return () => observer.disconnect();
  }, [post.mediaType]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isVisible) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, [isVisible]);

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await postApi.toggleLike(post._id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
      if (result.liked) {
        setJustLiked(true);
        setTimeout(() => setJustLiked(false), 500);
      }
    } catch {
      // non-critical
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || !creator) return;
    try {
      const result = await creatorApi.follow(creator._id);
      setFollowing(result.following);
    } catch {
      // non-critical
    }
  };

  return (
    <div
      ref={itemRef}
      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-card transition-shadow duration-300 hover:shadow-lifted"
    >
      {/* header */}
      <div className="flex items-center justify-between gap-3 p-4">
        <Link to={creator ? `/creator/${creator.slug}` : '#'} className="group flex min-w-0 items-center gap-3">
          {creator?.user.avatarUrl ? (
            <img
              src={creator.user.avatarUrl}
              alt=""
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/10 transition-all group-hover:ring-orange-400/50"
            />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-sm font-bold text-orange-300 ring-2 ring-white/10 transition-all group-hover:ring-orange-400/50">
              {creator?.user.name.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="flex min-w-0 items-center gap-1">
            <span className="truncate text-sm font-bold text-white group-hover:text-orange-300">{creator?.user.name}</span>
            <BadgeCheck size={17} className="shrink-0 fill-emerald-500 text-white" strokeWidth={2.5} />
          </span>
        </Link>

        {creator && (
          <button
            onClick={handleFollow}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors',
              following ? 'bg-white/10 text-white/60 hover:bg-white/15' : 'bg-orange-500 text-white shadow-sm shadow-orange-500/30 hover:bg-orange-600'
            )}
          >
            {following ? 'Following' : 'Follow'}
          </button>
        )}
      </div>

      {/* media */}
      <div className="relative bg-black">
        {post.mediaType === 'video' ? (
          <div className="relative" onDoubleClick={handleLike}>
            <video
              ref={videoRef}
              src={getUploadUrl(post.mediaUrl)}
              className={cn('w-full object-cover', compact ? 'h-80' : 'max-h-[50vh]')}
              loop
              muted={muted}
              playsInline
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onClick={togglePlayPause}
            />

            {/* big center play/pause indicator, shown briefly on state change */}
            <AnimatePresence>
              {!playing && (
                <motion.button
                  key="paused-indicator"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={togglePlayPause}
                  className="absolute inset-0 flex items-center justify-center bg-black/20"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                    <Play size={22} className="ml-1" fill="currentColor" />
                  </span>
                </motion.button>
              )}
            </AnimatePresence>

            <div className="absolute bottom-3 right-3 flex gap-2">
              <button
                onClick={togglePlayPause}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                {playing ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>
              <button
                onClick={() => setMuted((m) => !m)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
              >
                {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>
        ) : (
          <div className="relative" onDoubleClick={handleLike}>
            <img
              src={getUploadUrl(post.mediaUrl)}
              alt={post.caption}
              className={cn('w-full object-cover', compact ? 'h-80' : 'max-h-[50vh]')}
            />
          </div>
        )}

        <AnimatePresence>
          {justLiked && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.15 }}
              exit={{ opacity: 0, scale: 1.4 }}
              transition={{ duration: 0.4 }}
              className="pointer-events-none absolute inset-0 flex items-center justify-center"
            >
              <Heart size={90} className="fill-white text-white drop-shadow-lg" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* footer */}
      <div className="p-4">
        <button
          onClick={handleLike}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors',
            liked ? 'bg-red-500/15 text-red-400' : 'bg-white/5 text-white/70 hover:bg-white/10'
          )}
        >
          <Heart size={17} className={cn('transition-transform', liked && 'fill-red-500 text-red-500 scale-110')} />
          {likeCount}
        </button>

        {post.caption && (
          <p className={cn('mt-3 text-sm leading-relaxed text-white/80', compact && 'line-clamp-2')}>
            {creator && <span className="mr-1.5 font-bold text-white">{creator.user.name}</span>}
            {post.caption}
          </p>
        )}
        <p className="mt-2 text-[11px] uppercase tracking-wide text-white/35">
          {new Date(post.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
        </p>
      </div>
    </div>
  );
}
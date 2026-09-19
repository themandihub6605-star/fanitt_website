import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Volume2, VolumeX, Play, Pause, MoreHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { postApi, type ApiPost } from '@/services/postApi';
import { creatorApi } from '@/services/creatorApi';
import { getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function timeAgo(dateString: string) {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Full-screen lightbox — opened by clicking any media tile. */
function Lightbox({
  mediaItems,
  startIndex,
  onClose,
}: {
  mediaItems: { url: string; type: 'image' | 'video' }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const item = mediaItems[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={20} />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:left-4"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {index < mediaItems.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 sm:right-4"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {item.type === 'video' ? (
        <video
          src={getUploadUrl(item.url)}
          controls
          autoPlay
          className="max-h-[85vh] max-w-full rounded-xl"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <motion.img
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          src={getUploadUrl(item.url)}
          alt=""
          className="max-h-[85vh] max-w-full rounded-xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      )}

      {mediaItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {mediaItems.map((_, i) => (
            <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === index ? 'bg-white' : 'bg-white/35')} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/** A single media tile. `suspend` (true while the lightbox is open for
 * this post) forcibly pauses this tile's own video — otherwise opening
 * the lightbox started a second, independent video playing over the
 * first, doubling both the picture and the audio. */
function MediaTile({
  url,
  type,
  onOpen,
  onDoubleClick,
  muted,
  onToggleMute,
  suspend,
}: {
  url: string;
  type: 'image' | 'video';
  onOpen: () => void;
  onDoubleClick: () => void;
  muted: boolean;
  onToggleMute: () => void;
  suspend: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [playing, setPlaying] = useState(false);
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (type !== 'video' || !tileRef.current) return;
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: 0.6 });
    observer.observe(tileRef.current);
    return () => observer.disconnect();
  }, [type]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (suspend) {
      videoRef.current.pause();
      return;
    }
    if (isVisible) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  }, [isVisible, suspend]);

  const togglePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  };

  const handleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;
      onDoubleClick();
    } else {
      clickTimer.current = setTimeout(() => {
        clickTimer.current = null;
        onOpen();
      }, 220);
    }
  };

  return (
    <div
      ref={tileRef}
      onClick={handleClick}
      className="relative h-[380px] w-[78vw] max-w-[300px] shrink-0 cursor-pointer select-none snap-start overflow-hidden rounded-2xl bg-black sm:h-[460px] sm:w-[370px] sm:max-w-none"
    >
      {type === 'video' ? (
        <>
          <video
            ref={videoRef}
            src={getUploadUrl(url)}
            className="h-full w-full object-cover"
            loop
            muted={muted}
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />

          <AnimatePresence>
            {!playing && (
              <motion.div
                key="paused-indicator"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                  <Play size={20} className="ml-1" fill="currentColor" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>

          <button
            onClick={togglePlayPause}
            className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
          </button>
        </>
      ) : (
        <img src={getUploadUrl(url)} alt="" className="h-full w-full object-cover" draggable={false} />
      )}
    </div>
  );
}

export function FeedPostCard({
  post,
  isFollowing,
  onFollowChange,
}: {
  post: ApiPost;
  compact?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (creatorId: string, following: boolean) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [muted, setMuted] = useState(true);
  const [justLiked, setJustLiked] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const creator = typeof post.creator === 'object' ? post.creator : null;
  const mediaItems = post.mediaItems || [];

  useEffect(() => {
    if (user) setLiked(post.likedBy.includes(user._id));
  }, [user, post.likedBy]);

  const scrollByTile = (direction: 1 | -1) => {
    const el = rowRef.current;
    if (!el) return;
    const tile = el.querySelector<HTMLElement>(':scope > div');
    const step = (tile?.offsetWidth || 370) + 8;
    el.scrollBy({ left: step * direction, behavior: 'smooth' });
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
      onFollowChange?.(creator._id, result.following);
    } catch {
      // non-critical
    }
  };

  return (
    <div className="relative border-b border-white/10 px-4 py-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-navy-800/40">
      {/* header — avatar, username, timestamp, "..." menu, all one row like Threads */}
      <div className="flex items-start gap-3">
        <Link to={creator ? `/creator/${creator.slug}` : '#'} className="shrink-0">
          {creator?.user?.avatarUrl ? (
            <img src={creator.user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              {creator?.user?.name?.charAt(0).toUpperCase() || '?'}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <Link to={creator ? `/creator/${creator.slug}` : '#'} className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-sm font-bold text-white">{creator?.user?.name}</span>
              <span className="shrink-0 text-xs text-white/40">{timeAgo(post.createdAt)}</span>
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {creator && !isFollowing && (
                <button onClick={handleFollow} className="text-xs font-bold text-orange-400 hover:text-orange-300">
                  Follow
                </button>
              )}
              <button className="text-white/30 hover:text-white/60">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>

          {post.caption && <p className="mt-0.5 text-sm leading-relaxed text-white/85">{post.caption}</p>}

          {/* media row */}
          {mediaItems.length > 0 && (
            <div className="group relative mt-3 -mr-4 sm:mr-0">
              <div
                ref={rowRef}
                className="flex gap-2 overflow-x-auto pb-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              >
                {mediaItems.map((item, i) => (
                  <MediaTile
                    key={i}
                    url={item.url}
                    type={item.type}
                    muted={muted}
                    onToggleMute={() => setMuted((m) => !m)}
                    onDoubleClick={handleLike}
                    onOpen={() => setLightboxIndex(i)}
                    suspend={lightboxIndex !== null}
                  />
                ))}
              </div>

              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={() => scrollByTile(-1)}
                    className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:flex"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => scrollByTile(1)}
                    className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:flex"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
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
                    <Heart size={80} className="fill-white text-white drop-shadow-lg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          <div className="mt-2 flex items-center gap-4">
            <button onClick={handleLike} className="flex items-center gap-1.5 text-white/70 hover:text-white">
              <Heart size={22} className={cn('transition-transform', liked && 'fill-red-500 text-red-500 scale-110')} />
            </button>
          </div>

          {likeCount > 0 && <p className="mt-1 text-xs font-semibold text-white/50">{likeCount} like{likeCount === 1 ? '' : 's'}</p>}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox mediaItems={mediaItems} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
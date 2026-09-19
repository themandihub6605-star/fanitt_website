import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, Play, Heart, BadgeCheck, Layers, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { postApi, type ApiPost } from '@/services/postApi';
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
  return `${Math.floor(hours / 24)}d`;
}

/** Same full-screen lightbox pattern used in Feed — tapping a homepage
 * preview card opens the actual post here (media, full caption, like)
 * instead of just linking off to the general /feed page. */
function PostLightbox({ post, onClose }: { post: ApiPost; onClose: () => void }) {
  const [mediaIndex, setMediaIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);
  const mediaItems = post.mediaItems || [];
  const activeMedia = mediaItems[mediaIndex];
  const creator = typeof post.creator === 'object' ? post.creator : null;

  useEffect(() => {
    if (user) setLiked(post.likedBy.includes(user._id));
  }, [user, post.likedBy]);

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await postApi.toggleLike(post._id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      // non-critical
    }
  };

  if (!activeMedia) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
      >
        <X size={18} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[85vh] w-full max-w-sm overflow-hidden rounded-2xl bg-black"
      >
        {activeMedia.type === 'video' ? (
          <video key={activeMedia.url} src={getUploadUrl(activeMedia.url)} className="max-h-[85vh] w-full object-contain" controls autoPlay loop playsInline />
        ) : (
          <img src={getUploadUrl(activeMedia.url)} alt="" className="max-h-[85vh] w-full object-contain" />
        )}

        {mediaItems.length > 1 && (
          <>
            {mediaIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIndex((m) => m - 1);
                }}
                className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronLeft size={15} />
              </button>
            )}
            {mediaIndex < mediaItems.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMediaIndex((m) => m + 1);
                }}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                <ChevronRight size={15} />
              </button>
            )}
            <div className="absolute top-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {mediaItems.map((_, i) => (
                <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === mediaIndex ? 'bg-white' : 'bg-white/35')} />
              ))}
            </div>
          </>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              {creator?.user?.name && <p className="truncate text-sm font-bold text-white">{creator.user.name}</p>}
              {post.caption && <p className="mt-1 max-h-24 overflow-y-auto text-xs leading-relaxed text-white/85">{post.caption}</p>}
            </div>
            <button onClick={handleLike} className="flex shrink-0 flex-col items-center gap-0.5">
              <Heart size={22} className={cn('transition-colors', liked ? 'fill-red-500 text-red-500' : 'text-white')} />
              <span className="text-[10px] font-semibold text-white">{likeCount}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** A slim, fixed-size preview card for the homepage carousel. Tapping it
 * opens the post in a full lightbox (above) rather than only linking off
 * to /feed, so the whole caption and media are actually reachable from
 * here. */
function PostPreviewCard({ post, onOpen }: { post: ApiPost; onOpen: () => void }) {
  const creator = typeof post.creator === 'object' ? post.creator : null;
  const thumb = post.mediaItems?.[0];

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-[400px] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 text-left shadow-card transition-shadow hover:shadow-lifted"
    >
      {/* header — fixed height */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-3 pt-3">
        {creator?.user?.avatarUrl ? (
          <img src={creator.user.avatarUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
            {creator?.user?.name?.charAt(0).toUpperCase() || '?'}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-xs font-bold text-white">{creator?.user?.name}</span>
            <BadgeCheck size={12} className="shrink-0 fill-emerald-500 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] text-white/40">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* caption — fixed height, always the same regardless of length */}
      <div className="h-9 shrink-0 px-3 pb-1.5 pt-0.5">
        {post.caption && <p className="line-clamp-2 text-[11px] leading-tight text-white/65">{post.caption}</p>}
      </div>

      {/* thumbnail — fixed pixel height (not aspect-based), so total card
       * height is 100% deterministic and identical across every card
       * regardless of what's inside */}
      <div className="relative h-[260px] w-full shrink-0 bg-black">
        {thumb ? (
          thumb.type === 'video' ? (
            <video src={getUploadUrl(thumb.url)} className="h-full w-full object-cover" muted playsInline />
          ) : (
            <img src={getUploadUrl(thumb.url)} alt="" className="h-full w-full object-cover" loading="lazy" />
          )
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <Layers size={20} />
          </div>
        )}

        {thumb?.type === 'video' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm">
              <Play size={15} className="ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}

        {post.mediaItems && post.mediaItems.length > 1 && (
          <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
            <Layers size={9} /> {post.mediaItems.length}
          </span>
        )}
      </div>

      {/* footer — fixed height, fills the rest */}
      <div className="flex flex-1 items-center gap-1.5 px-3 text-white/60">
        <Heart size={13} className={cn(post.likeCount > 0 && 'fill-red-500 text-red-500')} />
        <span className="text-[11px] font-semibold">{post.likeCount}</span>
      </div>
    </button>
  );
}
export function LatestPosts() {
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openPost, setOpenPost] = useState<ApiPost | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    postApi
      .getFeed(4)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoaded(true));
  }, []);

  const scrollByAmount = (dir: 1 | -1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (loaded && posts.length === 0) return null;
  if (!loaded) return null;

  return (
    <section className="py-section-mobile md:py-section">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-300">
              Fresh
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">Latest from creators</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden gap-2 sm:flex">
              <button
                onClick={() => scrollByAmount(-1)}
                aria-label="Scroll left"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => scrollByAmount(1)}
                aria-label="Scroll right"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-navy-800/70 text-white/70 transition-colors hover:border-orange-300 hover:text-orange-400"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <Link to="/feed">
              <Button variant="outline" size="sm">
                View Feed <ArrowRight size={15} />
              </Button>
            </Link>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="mt-8 flex items-start gap-4 overflow-x-auto pb-3 pr-6 scroll-smooth snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {posts.map((post, i) => (
            <motion.div
              key={post._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="w-[240px] shrink-0 snap-start sm:w-[260px]"
            >
              <PostPreviewCard post={post} onOpen={() => setOpenPost(post)} />
            </motion.div>
          ))}
        </div>
      </Container>

      <AnimatePresence>
        {openPost && <PostLightbox post={openPost} onClose={() => setOpenPost(null)} />}
      </AnimatePresence>
    </section>
  );
}
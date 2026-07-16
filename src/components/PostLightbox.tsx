import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { postApi, type ApiPost } from '@/services/postApi';
import { getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

interface PostLightboxProps {
  posts: ApiPost[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}

export function PostLightbox({ posts, index, onClose, onIndexChange }: PostLightboxProps) {
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(true);
  const [localPosts, setLocalPosts] = useState(posts);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const post = localPosts[index];
  if (!post) return null;

  const isLiked = user ? post.likedBy.includes(user._id) : false;
  const creatorName = typeof post.creator === 'object' ? post.creator.user.name : '';

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play().catch(() => {});
    else videoRef.current.pause();
  };

  const handleLike = async () => {
    if (!isAuthenticated) return;
    try {
      const result = await postApi.toggleLike(post._id);
      setLocalPosts((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, likeCount: result.likeCount, likedBy: result.liked ? [...p.likedBy, user!._id] : p.likedBy.filter((id) => id !== user!._id) }
            : p
        )
      );
    } catch {
      // silently ignore — liking is non-critical
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <button onClick={onClose} className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20">
          <X size={18} />
        </button>

        {index > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index - 1);
            }}
            className="absolute left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {index < localPosts.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onIndexChange(index + 1);
            }}
            className="absolute right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            style={{ right: '4rem' }}
          >
            <ChevronRight size={18} />
          </button>
        )}

        <motion.div
          key={post._id}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[85vh] w-full max-w-sm overflow-hidden rounded-2xl bg-black"
        >
          {post.mediaType === 'video' ? (
            <div className="relative">
              <video
                ref={videoRef}
                src={getUploadUrl(post.mediaUrl)}
                className="max-h-[85vh] w-full object-contain"
                autoPlay
                loop
                muted={muted}
                playsInline
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onClick={togglePlayPause}
              />
              <div className="absolute bottom-3 right-3 flex gap-2">
                <button
                  onClick={togglePlayPause}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                </button>
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                >
                  {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>
            </div>
          ) : (
            <img src={getUploadUrl(post.mediaUrl)} alt={post.caption} className="max-h-[85vh] w-full object-contain" />
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {creatorName && <p className="truncate text-sm font-bold text-white">{creatorName}</p>}
                {post.caption && <p className="mt-0.5 line-clamp-2 text-xs text-white/80">{post.caption}</p>}
              </div>
              <button onClick={handleLike} className="flex shrink-0 flex-col items-center gap-0.5">
                <Heart size={22} className={cn('transition-colors', isLiked ? 'fill-red-500 text-red-500' : 'text-white')} />
                <span className="text-[10px] font-semibold text-white">{post.likeCount}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
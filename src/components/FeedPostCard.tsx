import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MoreHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import {
  postApi,
  type ApiPost,
  type PostLike,
} from '@/services/postApi';
import { creatorApi } from '@/services/creatorApi';
import { getUploadUrl } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function timeAgo(dateString: string) {
  const diffMs =
    Date.now() - new Date(dateString).getTime();

  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'now';

  if (mins < 60) return `${mins}m`;

  const hours = Math.floor(mins / 60);

  if (hours < 24) return `${hours}h`;

  const days = Math.floor(hours / 24);

  if (days < 7) return `${days}d`;

  return new Date(dateString).toLocaleDateString(
    'en-IN',
    {
      day: 'numeric',
      month: 'short',
    }
  );
}

/**
 * Full-screen lightbox
 */
function Lightbox({
  mediaItems,
  startIndex,
  onClose,
}: {
  mediaItems: {
    url: string;
    type: 'image' | 'video';
  }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] =
    useState(startIndex);

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
          onClick={(e) =>
            e.stopPropagation()
          }
        />
      ) : (
        <motion.img
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          src={getUploadUrl(item.url)}
          alt=""
          className="max-h-[85vh] max-w-full rounded-xl object-contain"
          onClick={(e) =>
            e.stopPropagation()
          }
        />
      )}

      {mediaItems.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
          {mediaItems.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                i === index
                  ? 'bg-white'
                  : 'bg-white/35'
              )}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Single media tile
 */
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
  const videoRef =
    useRef<HTMLVideoElement>(null);

  const tileRef =
    useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] =
    useState(false);

  const [playing, setPlaying] =
    useState(false);

  const clickTimer =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  useEffect(() => {
    if (
      type !== 'video' ||
      !tileRef.current
    ) {
      return;
    }

    const observer =
      new IntersectionObserver(
        ([entry]) =>
          setIsVisible(
            entry.isIntersecting
          ),
        {
          threshold: 0.6,
        }
      );

    observer.observe(tileRef.current);

    return () =>
      observer.disconnect();
  }, [type]);

  useEffect(() => {
    if (!videoRef.current) return;

    if (suspend) {
      videoRef.current.pause();
      return;
    }

    if (isVisible) {
      videoRef.current
        .play()
        .catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible, suspend]);

  const togglePlayPause = (
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .catch(() => {});
    } else {
      videoRef.current.pause();
    }
  };

  const handleClick = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current);
      clickTimer.current = null;

      onDoubleClick();
    } else {
      clickTimer.current =
        setTimeout(() => {
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
            onPlay={() =>
              setPlaying(true)
            }
            onPause={() =>
              setPlaying(false)
            }
          />

          <AnimatePresence>
            {!playing && (
              <motion.div
                key="paused-indicator"
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm">
                  <Play
                    size={20}
                    className="ml-1"
                    fill="currentColor"
                  />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* GLOBAL MUTE BUTTON */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute();
            }}
            className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
            aria-label={
              muted
                ? 'Turn sound on'
                : 'Turn sound off'
            }
          >
            {muted ? (
              <VolumeX size={14} />
            ) : (
              <Volume2 size={14} />
            )}
          </button>

          <button
            onClick={togglePlayPause}
            className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {playing ? (
              <Pause size={13} />
            ) : (
              <Play
                size={13}
                className="ml-0.5"
              />
            )}
          </button>
        </>
      ) : (
        <img
          src={getUploadUrl(url)}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      )}
    </div>
  );
}

/**
 * Likes modal
 */
function LikesModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [likes, setLikes] =
    useState<PostLike[] | null>(null);

  useEffect(() => {
    postApi
      .getLikes(postId)
      .then(setLikes)
      .catch(() => setLikes([]));
  }, [postId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
      onClick={onClose}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 24,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          y: 24,
        }}
        transition={{
          duration: 0.25,
          ease: [0.22, 1, 0.36, 1],
        }}
        onClick={(e) =>
          e.stopPropagation()
        }
        className="max-h-[70vh] w-full max-w-sm overflow-hidden rounded-t-2xl border border-white/10 bg-navy-800 shadow-lifted sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
          <p className="text-sm font-bold text-white">
            Liked by
          </p>

          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        <div className="max-h-[calc(70vh-52px)] overflow-y-auto p-2">
          {likes === null ? (
            <div className="flex justify-center py-8">
              <Loader2
                size={20}
                className="animate-spin text-white/30"
              />
            </div>
          ) : likes.length === 0 ? (
            <p className="py-8 text-center text-sm text-white/40">
              No likes yet.
            </p>
          ) : (
            likes.map((u) => (
              <div
                key={u._id}
                className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/5"
              >
                {u.avatarUrl ? (
                  <img
                    src={u.avatarUrl}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
                    {u.name
                      .charAt(0)
                      .toUpperCase()}
                  </span>
                )}

                <span className="truncate text-sm font-semibold text-white">
                  {u.name}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function FeedPostCard({
  post,
  isFollowing,
  onFollowChange,

  // GLOBAL AUDIO PROPS
  muted,
  onToggleMute,
}: {
  post: ApiPost;
  compact?: boolean;
  isFollowing?: boolean;
  onFollowChange?: (
    creatorId: string,
    following: boolean
  ) => void;

  // These now come from Feed.tsx
  muted: boolean;
  onToggleMute: () => void;
}) {
  const navigate = useNavigate();

  const [liked, setLiked] =
    useState(false);

  const [likeCount, setLikeCount] =
    useState(post.likeCount);

  const [likePreview, setLikePreview] =
    useState(post.likePreview || []);

  const [justLiked, setJustLiked] =
    useState(false);

  const [justFollowed, setJustFollowed] =
    useState(false);

  const [lightboxIndex, setLightboxIndex] =
    useState<number | null>(null);

  const [likesOpen, setLikesOpen] =
    useState(false);

  const rowRef =
    useRef<HTMLDivElement>(null);

  const {
    isAuthenticated,
    user,
  } = useAppSelector(
    (s) => s.auth
  );

  const creator =
    typeof post.creator === 'object'
      ? post.creator
      : null;

  const mediaItems =
    post.mediaItems || [];

  const isOwnPost =
    !!user &&
    !!creator?.user &&
    creator.user._id === user._id;

  useEffect(() => {
    if (user) {
      setLiked(
        post.likedBy.includes(
          user._id
        )
      );
    }
  }, [user, post.likedBy]);

  const scrollByTile = (
    direction: 1 | -1
  ) => {
    const el = rowRef.current;

    if (!el) return;

    const tile =
      el.querySelector<HTMLElement>(
        ':scope > div'
      );

    const step =
      (tile?.offsetWidth || 370) + 8;

    el.scrollBy({
      left: step * direction,
      behavior: 'smooth',
    });
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/get-started');
      return;
    }

    try {
      const result =
        await postApi.toggleLike(
          post._id
        );

      setLiked(result.liked);
      setLikeCount(
        result.likeCount
      );

      if (user) {
        if (result.liked) {
          setLikePreview(
            (prev) =>
              [
                {
                  _id: user._id,
                  name: user.name,
                  avatarUrl:
                    user.avatarUrl,
                },
                ...prev,
              ].slice(0, 3)
          );
        } else {
          setLikePreview(
            (prev) =>
              prev.filter(
                (u) =>
                  u._id !== user._id
              )
          );
        }
      }

      if (result.liked) {
        setJustLiked(true);

        setTimeout(
          () =>
            setJustLiked(false),
          500
        );
      }
    } catch {
      // non-critical
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/get-started');
      return;
    }

    if (!creator) return;

    try {
      const result =
        await creatorApi.follow(
          creator._id
        );

      onFollowChange?.(
        creator._id,
        result.following
      );

      if (result.following) {
        setJustFollowed(true);

        setTimeout(
          () =>
            setJustFollowed(false),
          500
        );
      }
    } catch {
      // non-critical
    }
  };

  return (
    <div className="relative border-b border-white/10 px-4 py-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-navy-800/40">

      {/* HEADER */}
      <div className="flex items-start gap-3">

        <Link
          to={
            creator
              ? `/creator/${creator.slug}`
              : '#'
          }
          className="shrink-0"
        >
          {creator?.user?.avatarUrl ? (
            <img
              src={creator.user.avatarUrl}
              alt=""
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/20 text-xs font-bold text-orange-300">
              {creator?.user?.name
                ?.charAt(0)
                .toUpperCase() ||
                '?'}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">

          <div className="flex items-center justify-between gap-2">

            <Link
              to={
                creator
                  ? `/creator/${creator.slug}`
                  : '#'
              }
              className="flex min-w-0 items-center gap-1.5"
            >
              <span className="truncate text-sm font-bold text-white">
                {creator?.user?.name}
              </span>

              <span className="shrink-0 text-xs text-white/40">
                {timeAgo(
                  post.createdAt
                )}
              </span>
            </Link>

            <div className="flex shrink-0 items-center gap-2">

              {creator &&
                !isOwnPost &&
                (isFollowing ? (
                  <motion.button
                    onClick={
                      handleFollow
                    }
                    whileTap={{
                      scale: 0.9,
                    }}
                    className="group rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-white/70 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                  >
                    <span className="group-hover:hidden">
                      Following
                    </span>

                    <span className="hidden group-hover:inline">
                      Unfollow
                    </span>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={
                      handleFollow
                    }
                    whileTap={{
                      scale: 0.9,
                    }}
                    animate={
                      justFollowed
                        ? {
                            scale: [
                              1,
                              1.15,
                              1,
                            ],
                          }
                        : {}
                    }
                    transition={{
                      duration: 0.35,
                    }}
                    className="rounded-full bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-soft transition-colors hover:bg-orange-400"
                  >
                    Follow
                  </motion.button>
                ))}

              <button className="text-white/30 hover:text-white/60">
                <MoreHorizontal
                  size={16}
                />
              </button>
            </div>
          </div>

          {post.caption && (
            <p className="mt-0.5 text-sm leading-relaxed text-white/85">
              {post.caption}
            </p>
          )}

          {/* MEDIA */}
          {mediaItems.length > 0 && (
            <div className="group relative mt-3 -mr-4 sm:mr-0">

              <div
                ref={rowRef}
                className="flex gap-2 overflow-x-auto pb-1 pr-4 [-ms-overflow-style:none] [scrollbar-width:none] snap-x snap-mandatory [&::-webkit-scrollbar]:hidden"
              >
                {mediaItems.map(
                  (item, i) => (
                    <MediaTile
                      key={i}
                      url={item.url}
                      type={item.type}

                      // GLOBAL MUTE STATE
                      muted={muted}
                      onToggleMute={
                        onToggleMute
                      }

                      onDoubleClick={
                        handleLike
                      }

                      onOpen={() =>
                        setLightboxIndex(
                          i
                        )
                      }

                      suspend={
                        lightboxIndex !==
                        null
                      }
                    />
                  )
                )}
              </div>

              {mediaItems.length >
                1 && (
                <>
                  <button
                    onClick={() =>
                      scrollByTile(-1)
                    }
                    className="absolute left-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:flex"
                  >
                    <ChevronLeft
                      size={18}
                    />
                  </button>

                  <button
                    onClick={() =>
                      scrollByTile(1)
                    }
                    className="absolute right-2 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100 sm:flex"
                  >
                    <ChevronRight
                      size={18}
                    />
                  </button>
                </>
              )}

              <AnimatePresence>
                {justLiked && (
                  <motion.div
                    initial={{
                      opacity: 0,
                      scale: 0.5,
                    }}
                    animate={{
                      opacity: 1,
                      scale: 1.15,
                    }}
                    exit={{
                      opacity: 0,
                      scale: 1.4,
                    }}
                    transition={{
                      duration: 0.4,
                    }}
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <Heart
                      size={80}
                      className="fill-white text-white drop-shadow-lg"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* LIKE BUTTON */}
          <div className="mt-2 flex items-center gap-4">
            <motion.button
              onClick={
                handleLike
              }
              whileTap={{
                scale: 0.8,
              }}
              animate={
                justLiked
                  ? {
                      scale: [
                        1,
                        1.3,
                        1,
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 0.35,
              }}
              className="flex items-center gap-1.5 text-white/70 hover:text-white"
            >
              <Heart
                size={22}
                className={cn(
                  'transition-transform',
                  liked &&
                    'fill-red-500 text-red-500 scale-110'
                )}
              />
            </motion.button>
          </div>

          {/* LIKES */}
          {likeCount > 0 && (
            <button
              onClick={() =>
                setLikesOpen(true)
              }
              className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white/90"
            >
              {likePreview.length >
                0 && (
                <div className="flex -space-x-2">
                  {likePreview
                    .slice(0, 3)
                    .map(
                      (
                        u,
                        idx
                      ) =>
                        u.avatarUrl ? (
                          <img
                            key={
                              u._id
                            }
                            src={
                              u.avatarUrl
                            }
                            alt=""
                            className="h-5 w-5 rounded-full border border-navy-900 object-cover"
                            style={{
                              zIndex:
                                3 -
                                idx,
                            }}
                          />
                        ) : (
                          <span
                            key={
                              u._id
                            }
                            className="flex h-5 w-5 items-center justify-center rounded-full border border-navy-900 bg-orange-500/30 text-[9px] font-bold text-orange-200"
                            style={{
                              zIndex:
                                3 -
                                idx,
                            }}
                          >
                            {u.name
                              .charAt(
                                0
                              )
                              .toUpperCase()}
                          </span>
                        )
                    )}
                </div>
              )}

              <span>
                {likePreview.length >
                0 ? (
                  <>
                    Liked by{' '}
                    <span className="text-white">
                      {
                        likePreview[0]
                          .name
                      }
                    </span>

                    {likeCount >
                      1 && (
                      <>
                        {' '}
                        and{' '}
                        <span className="text-white">
                          {likeCount -
                            1}{' '}
                          other
                          {likeCount -
                            1 ===
                          1
                            ? ''
                            : 's'}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {likeCount}{' '}
                    like
                    {likeCount ===
                    1
                      ? ''
                      : 's'}
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {lightboxIndex !==
          null && (
          <Lightbox
            mediaItems={
              mediaItems
            }
            startIndex={
              lightboxIndex
            }
            onClose={() =>
              setLightboxIndex(
                null
              )
            }
          />
        )}

        {likesOpen && (
          <LikesModal
            postId={post._id}
            onClose={() =>
              setLikesOpen(false)
            }
          />
        )}
      </AnimatePresence>
    </div>
  );
}
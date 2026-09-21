import { useState } from 'react';
import { Play, Trash2, Heart, Pencil, Layers } from 'lucide-react';
import { PostLightbox } from './PostLightbox';
import { getUploadUrl } from '@/services/apiClient';
import type { ApiPost } from '@/services/postApi';

interface PostsGridProps {
  posts: ApiPost[];
  onDelete?: (postId: string) => void;
  onEditCaption?: (postId: string, newCaption: string) => void;
}

export function PostsGrid({ posts, onDelete, onEditCaption }: PostsGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (posts.length === 0) return null;

  const handleEdit = (post: ApiPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = window.prompt('Edit caption:', post.caption);
    if (next !== null && next !== post.caption) onEditCaption?.(post._id, next);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {posts.map((post, i) => {
          // The grid tile always shows the post's first media item as its
          // thumbnail — a "1/N" badge signals there's more inside when
          // the post has multiple photos/videos.
          const thumb = post.mediaItems?.[0];

          return (
            <div
              key={post._id}
              role="button"
              tabIndex={0}
              onClick={() => setLightboxIndex(i)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLightboxIndex(i)}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-white/5"
            >
              {thumb ? (
                thumb.type === 'video' ? (
                  <video src={getUploadUrl(thumb.url)} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={getUploadUrl(thumb.url)} alt={post.caption} loading="lazy" className="h-full w-full object-cover" />
                )
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white/20">
                  <Layers size={20} />
                </div>
              )}

              {thumb?.type === 'video' && (
                <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white">
                  <Play size={10} fill="currentColor" />
                </span>
              )}

              {post.mediaItems && post.mediaItems.length > 1 && (
                <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  <Layers size={10} /> {post.mediaItems.length}
                </span>
              )}

              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <Heart size={14} fill="currentColor" />
                <span className="text-xs font-bold">{post.likeCount}</span>
              </div>

              <div className="absolute left-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                {onEditCaption && (
                  <button
                    onClick={(e) => handleEdit(post, e)}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-orange-500/80"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(post._id);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500/80"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <PostLightbox
          posts={posts}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </>
  );
}
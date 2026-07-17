import { useState } from 'react';
import { Play, Trash2, Heart } from 'lucide-react';
import { PostLightbox } from './PostLightbox';
import { getUploadUrl } from '@/services/apiClient';
import type { ApiPost } from '@/services/postApi';

interface PostsGridProps {
  posts: ApiPost[];
  onDelete?: (postId: string) => void;
}

export function PostsGrid({ posts, onDelete }: PostsGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (posts.length === 0) return null;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {posts.map((post, i) => (
          <button
            key={post._id}
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-white/5"
          >
            {post.mediaType === 'video' ? (
              <video src={getUploadUrl(post.mediaUrl)} className="h-full w-full object-cover" muted playsInline />
            ) : (
              <img src={getUploadUrl(post.mediaUrl)} alt={post.caption} loading="lazy" className="h-full w-full object-cover" />
            )}

            {post.mediaType === 'video' && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white">
                <Play size={10} fill="currentColor" />
              </span>
            )}

            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/0 text-white opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              <Heart size={14} fill="currentColor" />
              <span className="text-xs font-bold">{post.likeCount}</span>
            </div>

            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(post._id);
                }}
                className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity hover:bg-red-500/80 group-hover:opacity-100"
              >
                <Trash2 size={12} />
              </button>
            )}
          </button>
        ))}
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
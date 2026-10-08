import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, Pin, Megaphone, Trash2, Pencil, Check, X, Loader2, Globe, Lock } from 'lucide-react';
import { communityApi, timeAgo, type CommunityPost, type CommunityPoll } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { UserAvatar } from './CommunityAvatar';
import { CommentsSection } from './CommentsSection';

interface Props {
  post: CommunityPost;
  canInteract: boolean;
  canModerate: boolean;
  onChange: (post: CommunityPost) => void;
  onDelete: (postId: string) => void;
  defaultShowComments?: boolean;
  /** Paid community: show the "Free post" tag (visitors and moderators — not paying members). */
  showFreeTag?: boolean;
  /** Owner / moderator of a paid community: can open the post to everyone. */
  canMarkFree?: boolean;
}

export function PostCard({ post, canInteract, canModerate, onChange, onDelete, defaultShowComments = false, showFreeTag = false, canMarkFree = false }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isAuthor = user?._id === post.author?._id;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(false);
      setMenuOpen(false);
    }
  };

  const like = () =>
    canInteract &&
    run(async () => {
      // Optimistic
      onChange({ ...post, isLiked: !post.isLiked, likeCount: post.likeCount + (post.isLiked ? -1 : 1) });
      const res = await communityApi.likePost(post._id);
      onChange({ ...post, isLiked: res.liked, likeCount: res.likeCount });
    });

  const pin = () =>
    run(async () => {
      const res = await communityApi.pinPost(post._id);
      onChange({ ...post, isPinned: res.isPinned });
    });

  const toggleFree = () =>
    run(async () => {
      const res = await communityApi.setPostFree(post._id, !post.isFree);
      onChange({ ...post, isFree: res.isFree });
    });

  const remove = () => {
    if (!window.confirm('Delete this post and its comments?')) return;
    run(async () => {
      await communityApi.deletePost(post._id);
      onDelete(post._id);
    });
  };

  const saveEdit = () =>
    run(async () => {
      const updated = await communityApi.updatePost(post._id, draft);
      onChange({ ...post, text: updated.text, editedAt: updated.editedAt });
      setEditing(false);
    });

  const vote = (index: number) =>
    canInteract &&
    run(async () => {
      const poll = await communityApi.vote(post._id, index);
      onChange({ ...post, poll });
    });

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'rounded-2xl border bg-navy-800/60 p-4 sm:p-5',
        post.isAnnouncement ? 'border-orange-500/30 bg-orange-500/[0.04]' : 'border-white/10'
      )}
    >
      {(post.isPinned || post.isAnnouncement || (showFreeTag && post.isFree)) && (
        <div className="mb-3 flex flex-wrap gap-2">
          {showFreeTag && post.isFree && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              <Globe size={11} /> Free post
            </span>
          )}
          {post.isPinned && (
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white/70">
              <Pin size={11} /> Pinned
            </span>
          )}
          {post.isAnnouncement && (
            <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300">
              <Megaphone size={11} /> Announcement
            </span>
          )}
        </div>
      )}

      <header className="flex items-start gap-3">
        <UserAvatar user={post.author} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{post.author?.name}</p>
          <p className="text-xs text-white/45">
            {timeAgo(post.createdAt)}
            {post.editedAt && ' · edited'}
            {post.author?.role && <span className="capitalize"> · {post.author.role}</span>}
          </p>
        </div>
        {(isAuthor || canModerate) && (
          <div className="relative">
            <button onClick={() => setMenuOpen((v) => !v)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/[0.06] hover:text-white" aria-label="Post options">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <MoreHorizontal size={16} />}
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1b1b1b] py-1 shadow-lifted">
                {isAuthor && (
                  <MenuItem icon={Pencil} label="Edit" onClick={() => { setEditing(true); setMenuOpen(false); }} />
                )}
                {canMarkFree && (
                  <MenuItem icon={post.isFree ? Lock : Globe} label={post.isFree ? 'Make members only' : 'Make free for everyone'} onClick={toggleFree} />
                )}
                {canModerate && <MenuItem icon={Pin} label={post.isPinned ? 'Unpin' : 'Pin to top'} onClick={pin} />}
                <MenuItem icon={Trash2} label="Delete" danger onClick={remove} />
              </div>
            )}
          </div>
        )}
      </header>

      {editing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={3000}
            rows={4}
            className="w-full resize-none rounded-xl border border-white/10 bg-navy-900/40 px-3.5 py-2.5 text-sm text-white focus:border-orange-400 focus:outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button onClick={() => { setEditing(false); setDraft(post.text); }} className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-white/60">
              <X size={13} /> Cancel
            </button>
            <button onClick={saveEdit} disabled={busy} className="flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white">
              <Check size={13} /> Save
            </button>
          </div>
        </div>
      ) : (
        post.text && <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-white/85">{post.text}</p>
      )}

      {post.mediaItems.length > 0 && <MediaGrid items={post.mediaItems} />}
      {post.poll && <PollView poll={post.poll} canVote={canInteract} onVote={vote} />}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <footer className="mt-4 flex items-center gap-1 border-t border-white/10 pt-2">
        <button
          onClick={like}
          disabled={!canInteract}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-default',
            post.isLiked ? 'text-red-400' : 'text-white/60 hover:bg-white/[0.05] hover:text-white'
          )}
        >
          <Heart size={17} className={post.isLiked ? 'fill-red-400' : ''} /> {post.likeCount}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-white/60 hover:bg-white/[0.05] hover:text-white"
        >
          <MessageCircle size={17} /> {post.commentCount}
        </button>
      </footer>

      {showComments && (
        <CommentsSection
          postId={post._id}
          canComment={canInteract}
          canModerate={canModerate}
          onCountChange={(delta) => onChange({ ...post, commentCount: Math.max(0, post.commentCount + delta) })}
        />
      )}
    </motion.article>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }: { icon: typeof Pin; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/[0.06]', danger ? 'text-red-400' : 'text-white/80')}
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function MediaGrid({ items }: { items: CommunityPost['mediaItems'] }) {
  const count = items.length;
  return (
    <div className={cn('mt-3 grid gap-1.5 overflow-hidden rounded-2xl', count === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
      {items.map((m, i) => (
        <div key={i} className={cn('relative overflow-hidden bg-black', count === 1 ? 'max-h-[520px]' : 'aspect-square', count === 3 && i === 0 && 'row-span-2 aspect-auto')}>
          {m.type === 'video' ? (
            <video src={m.url} controls playsInline preload="metadata" className="h-full w-full object-cover" />
          ) : (
            <a href={m.url} target="_blank" rel="noreferrer">
              <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-[1.02]" />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function PollView({ poll, canVote, onVote }: { poll: CommunityPoll; canVote: boolean; onVote: (index: number) => void }) {
  const showResults = poll.myVote !== null || poll.isClosed || !canVote;
  return (
    <div className="mt-3 rounded-2xl border border-white/10 bg-navy-900/30 p-3.5">
      {poll.question && <p className="mb-2.5 text-sm font-bold text-white">{poll.question}</p>}
      <div className="space-y-2">
        {poll.options.map((opt, i) => {
          const pct = poll.totalVotes ? Math.round((opt.votes / poll.totalVotes) * 100) : 0;
          const mine = poll.myVote === i;
          return showResults ? (
            <div key={i} className="relative overflow-hidden rounded-xl border border-white/10 px-3 py-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={cn('absolute inset-y-0 left-0', mine ? 'bg-orange-500/25' : 'bg-white/[0.07]')}
              />
              <div className="relative flex items-center justify-between gap-2 text-sm">
                <span className={cn('font-semibold', mine ? 'text-orange-200' : 'text-white/85')}>
                  {opt.text} {mine && <Check size={13} className="inline" />}
                </span>
                <span className="text-xs font-bold text-white/60">{pct}%</span>
              </div>
            </div>
          ) : (
            <button
              key={i}
              onClick={() => onVote(i)}
              className="w-full rounded-xl border border-white/15 px-3 py-2 text-left text-sm font-semibold text-white/85 transition-colors hover:border-orange-400/60 hover:bg-orange-500/10"
            >
              {opt.text}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] text-white/40">
        {poll.totalVotes} vote{poll.totalVotes === 1 ? '' : 's'} ·{' '}
        {poll.isClosed ? 'Poll ended' : poll.endsAt ? `Ends ${new Date(poll.endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : 'Open'}
      </p>
    </div>
  );
}
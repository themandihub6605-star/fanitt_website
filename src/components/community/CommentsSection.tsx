import { useEffect, useState } from 'react';
import { Heart, Loader2, Send, Trash2 } from 'lucide-react';
import { communityApi, timeAgo, type CommunityComment } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { UserAvatar } from './CommunityAvatar';

interface Props {
  postId: string;
  canComment: boolean;
  canModerate: boolean;
  onCountChange: (delta: number) => void;
}

/** Comments with one level of replies. */
export function CommentsSection({ postId, canComment, canModerate, onCountChange }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [sending, setSending] = useState(false);

  const load = (nextPage = 1) => {
    setLoading(true);
    communityApi
      .comments(postId, nextPage)
      .then((res) => {
        setComments((prev) => (nextPage === 1 ? res.comments : [...prev, ...res.comments]));
        setPage(res.page);
        setPages(res.pages);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setSending(true);
    setError('');
    try {
      const comment = await communityApi.addComment(postId, value, replyTo?._id);
      if (comment.parentComment) {
        setComments((prev) =>
          prev.map((c) =>
            c._id === comment.parentComment ? { ...c, replies: [...(c.replies || []), comment], replyCount: c.replyCount + 1 } : c
          )
        );
      } else {
        setComments((prev) => [...prev, { ...comment, replies: [] }]);
      }
      onCountChange(1);
      setText('');
      setReplyTo(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const remove = async (comment: CommunityComment) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      const { removed } = await communityApi.deleteComment(comment._id);
      setComments((prev) =>
        comment.parentComment
          ? prev.map((c) =>
              c._id === comment.parentComment ? { ...c, replies: (c.replies || []).filter((r) => r._id !== comment._id) } : c
            )
          : prev.filter((c) => c._id !== comment._id)
      );
      onCountChange(-removed);
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const toggleLike = async (comment: CommunityComment) => {
    if (!canComment) return;
    try {
      const res = await communityApi.likeComment(comment._id);
      const apply = (c: CommunityComment): CommunityComment =>
        c._id === comment._id ? { ...c, isLiked: res.liked, likeCount: res.likeCount } : { ...c, replies: c.replies?.map(apply) };
      setComments((prev) => prev.map(apply));
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  const renderComment = (c: CommunityComment, isReply = false) => {
    const canDelete = user && (c.author?._id === user._id || canModerate);
    return (
      <div key={c._id} className={cn('flex gap-2.5', isReply && 'mt-3')}>
        <UserAvatar user={c.author} size={isReply ? 26 : 32} />
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-white/[0.05] px-3.5 py-2">
            <p className="text-xs font-bold text-white">{c.author?.name}</p>
            <p className="whitespace-pre-wrap break-words text-sm text-white/80">{c.text}</p>
          </div>
          <div className="mt-1 flex items-center gap-3 pl-2 text-[11px] font-semibold text-white/40">
            <span>{timeAgo(c.createdAt)}</span>
            <button onClick={() => toggleLike(c)} className={cn('flex items-center gap-1 hover:text-white', c.isLiked && 'text-red-400')}>
              <Heart size={11} className={c.isLiked ? 'fill-red-400' : ''} /> {c.likeCount > 0 ? c.likeCount : 'Like'}
            </button>
            {canComment && (
              <button onClick={() => setReplyTo(isReply ? comments.find((r) => r._id === c.parentComment) || c : c)} className="hover:text-white">
                Reply
              </button>
            )}
            {canDelete && (
              <button onClick={() => remove(c)} className="hover:text-red-400">
                <Trash2 size={11} />
              </button>
            )}
          </div>
          {!isReply && c.replies && c.replies.length > 0 && <div className="mt-1">{c.replies.map((r) => renderComment(r, true))}</div>}
        </div>
      </div>
    );
  };

  return (
    <div className="border-t border-white/10 pt-4">
      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-4 text-white/40">
          <Loader2 size={18} className="animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 && <p className="text-center text-xs text-white/40">No comments yet — start the conversation.</p>}
          {comments.map((c) => renderComment(c))}
          {page < pages && (
            <button onClick={() => load(page + 1)} disabled={loading} className="text-xs font-semibold text-orange-300 hover:text-orange-200">
              {loading ? 'Loading…' : 'Load more comments'}
            </button>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {canComment ? (
        <div className="mt-4">
          {replyTo && (
            <div className="mb-1.5 flex items-center justify-between rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs text-orange-200">
              Replying to {replyTo.author?.name}
              <button onClick={() => setReplyTo(null)} className="font-semibold hover:text-white">
                Cancel
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              maxLength={1000}
              placeholder={replyTo ? 'Write a reply…' : 'Write a comment…'}
              className="flex-1 rounded-full border border-white/10 bg-navy-900/40 px-4 py-2 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
            />
            <button
              onClick={send}
              disabled={sending || !text.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-40"
              aria-label="Send"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-center text-xs text-white/40">Join the community to comment.</p>
      )}
    </div>
  );
}
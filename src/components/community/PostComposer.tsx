import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AtSign, BarChart3, ImagePlus, Loader2, Megaphone, Plus, Send, X, AlertCircle, Globe } from 'lucide-react';
import { communityApi, type ApiCommunity, type CommunityPost, type CommunityUser } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';
import { UserAvatar } from './CommunityAvatar';

const MAX_MEDIA = 5;

interface Props {
  community: ApiCommunity;
  onPosted: (post: CommunityPost) => void;
}

/** New post: text, up to 5 photos/videos, a poll, @mentions, and (for
 * owner/moderators) the announcement flag. */
export function PostComposer({ community, onPosted }: Props) {
  const user = useAppSelector((s) => s.auth.user);
  const [expanded, setExpanded] = useState(false);
  const [text, setText] = useState('');
  const [media, setMedia] = useState<File[]>([]);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDays, setPollDays] = useState(3);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const canMakeFree = Boolean(community.isPaid && community.canModerate);
  const [mentions, setMentions] = useState<CommunityUser[]>([]);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState<CommunityUser[]>([]);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!showMention) return;
    const handle = window.setTimeout(() => {
      communityApi
        .members(community._id, { search: mentionQuery || undefined })
        .then((res) => setMentionResults(res.members.map((m) => m.user).filter((u) => u._id !== user?._id)))
        .catch(() => setMentionResults([]));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [showMention, mentionQuery, community._id, user?._id]);

  const reset = () => {
    setText('');
    setMedia([]);
    setShowPoll(false);
    setPollQuestion('');
    setPollOptions(['', '']);
    setPollDays(3);
    setIsAnnouncement(false);
    setMentions([]);
    setShowMention(false);
    setError('');
    setExpanded(false);
  };

  const addMention = (u: CommunityUser) => {
    if (!mentions.some((m) => m._id === u._id)) setMentions((prev) => [...prev, u]);
    setText((prev) => `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}@${u.name} `);
    setShowMention(false);
    setMentionQuery('');
  };

  // Copy the files out of the FileList *before* the input is cleared —
  // clearing it empties the live FileList, which used to drop the selection.
  const onFiles = (files: FileList | null) => {
    const picked = files ? Array.from(files) : [];
    if (picked.length === 0) return;
    setError('');
    setMedia((prev) => [...prev, ...picked].slice(0, MAX_MEDIA));
  };

  // One preview URL per file, released when the file list changes.
  const previews = useMemo(() => media.map((file) => URL.createObjectURL(file)), [media]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const submit = async () => {
    const options = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (showPoll && options.length < 2) {
      setError('Add at least 2 poll options');
      return;
    }
    if (!text.trim() && media.length === 0 && !showPoll) {
      setError('Write something, add media or create a poll');
      return;
    }
    setPosting(true);
    setError('');
    try {
      const post = await communityApi.createPost(community._id, {
        text: text.trim(),
        media,
        poll: showPoll ? { question: pollQuestion.trim(), options, durationHours: pollDays * 24 } : null,
        isAnnouncement,
        isFree: canMakeFree && isFree,
        // Only keep people still named in the text.
        mentions: mentions.filter((m) => text.includes(`@${m.name}`)).map((m) => m._id),
      });
      onPosted(post);
      reset();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-4">
      <div className="flex gap-3">
        <UserAvatar user={user ? { _id: user._id, name: user.name, avatarUrl: user.avatarUrl } : null} size={40} />
        <textarea
          value={text}
          onFocus={() => setExpanded(true)}
          onChange={(e) => setText(e.target.value)}
          maxLength={3000}
          rows={expanded ? 4 : 1}
          placeholder={`Share something with ${community.name}…`}
          className="min-h-[42px] flex-1 resize-none rounded-xl border border-white/10 bg-navy-900/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
        />
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {/* Media previews */}
            {media.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-[52px]">
                {media.map((file, i) => (
                  <div key={i} className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/10 bg-black">
                    {file.type.startsWith('video') ? (
                      <video src={previews[i]} className="h-full w-full object-cover" muted playsInline />
                    ) : (
                      <img src={previews[i]} alt={file.name} className="h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setMedia((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute right-1 top-1 rounded-full bg-black/70 p-0.5 text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Poll builder */}
            {showPoll && (
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-navy-900/40 p-3 sm:ml-[52px]">
                <input
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                  maxLength={200}
                  placeholder="Poll question (optional)"
                  className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                />
                {pollOptions.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={(e) => setPollOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))}
                      maxLength={80}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                    />
                    {pollOptions.length > 2 && (
                      <button type="button" onClick={() => setPollOptions((prev) => prev.filter((_, idx) => idx !== i))} className="px-2 text-white/40 hover:text-red-400">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {pollOptions.length < 6 ? (
                    <button type="button" onClick={() => setPollOptions((prev) => [...prev, ''])} className="flex items-center gap-1 text-xs font-semibold text-orange-300">
                      <Plus size={13} /> Add option
                    </button>
                  ) : (
                    <span />
                  )}
                  <label className="flex items-center gap-2 text-xs text-white/50">
                    Ends in
                    <select value={pollDays} onChange={(e) => setPollDays(Number(e.target.value))} className="rounded-lg border border-white/10 bg-navy-800 px-2 py-1 text-xs text-white">
                      {[1, 3, 7, 14].map((d) => (
                        <option key={d} value={d}>
                          {d} day{d === 1 ? '' : 's'}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            )}

            {/* Mention picker */}
            {showMention && (
              <div className="mt-3 rounded-xl border border-white/10 bg-navy-900/60 p-2 sm:ml-[52px]">
                <input
                  autoFocus
                  value={mentionQuery}
                  onChange={(e) => setMentionQuery(e.target.value)}
                  placeholder="Search members to tag"
                  className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                />
                <div className="mt-1 max-h-44 overflow-y-auto">
                  {mentionResults.length === 0 ? (
                    <p className="px-2 py-3 text-xs text-white/40">No members found</p>
                  ) : (
                    mentionResults.map((u) => (
                      <button key={u._id} type="button" onClick={() => addMention(u)} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.06]">
                        <UserAvatar user={u} size={26} />
                        <span className="text-sm text-white/85">{u.name}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {error && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-red-400 sm:ml-[52px]">
                <AlertCircle size={13} /> {error}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 sm:ml-[52px]">
              <div className="flex items-center gap-1">
                <ToolButton
                  label="Photo / video"
                  onClick={() => {
                    setExpanded(true);
                    fileRef.current?.click();
                  }}
                  disabled={media.length >= MAX_MEDIA}
                >
                  <ImagePlus size={17} />
                </ToolButton>
                <ToolButton label="Poll" active={showPoll} onClick={() => setShowPoll((v) => !v)}>
                  <BarChart3 size={17} />
                </ToolButton>
                <ToolButton label="Tag a member" active={showMention} onClick={() => setShowMention((v) => !v)}>
                  <AtSign size={17} />
                </ToolButton>
                {community.canModerate && (
                  <ToolButton label="Announcement — notifies every member" active={isAnnouncement} onClick={() => setIsAnnouncement((v) => !v)}>
                    <Megaphone size={17} />
                  </ToolButton>
                )}
                {canMakeFree && (
                  <ToolButton label="Free post — anyone can read it without a plan (max 3)" active={isFree} onClick={() => setIsFree((v) => !v)}>
                    <Globe size={17} />
                  </ToolButton>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,video/mp4,video/quicktime,video/webm"
                  multiple
                  hidden
                  onChange={(e) => {
                    onFiles(e.target.files);
                    // Allow picking the same file again later.
                    e.target.value = '';
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={reset} className="rounded-lg px-3 py-2 text-xs font-semibold text-white/50 hover:text-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={posting}
                  className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
                >
                  {posting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {isAnnouncement ? 'Announce' : 'Post'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToolButton({
  children,
  label,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg p-2 transition-colors disabled:opacity-40',
        active ? 'bg-orange-500/15 text-orange-300' : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
      )}
    >
      {children}
    </button>
  );
}
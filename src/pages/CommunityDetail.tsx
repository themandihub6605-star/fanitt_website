import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellOff,
  Crown,
  Globe,
  Loader2,
  Lock,
  MessagesSquare,
  ScrollText,
  Settings,
  ShieldCheck,
  Trash2,
  Users2,
  X,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CommunityFormModal } from '@/components/community/CommunityFormModal';
import { CommunityCover, CommunityIcon, ImageLightbox, UserAvatar } from '@/components/community/CommunityAvatar';
import { PostComposer } from '@/components/community/PostComposer';
import { PostCard } from '@/components/community/PostCard';
import { CommunityChat } from '@/components/community/CommunityChat';
import { MembersPanel } from '@/components/community/MembersPanel';
import { PaidPlansModal } from '@/components/community/PaidPlansModal';
import { communityApi, communityPriceLabel, needsPlan, PLAN_SUFFIX, rupees, type ApiCommunity, type CommunityPost } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

type Tab = 'posts' | 'chat' | 'members' | 'about';

/** A paid post seen without a plan: author, first line fading out, a
 * blurred picture with a lock, and the counts. Click → plans. */
function LockedPostCard({ post, onOpen }: { post: CommunityPost; onOpen: () => void }) {
  const hasMedia = (post.mediaCount ?? 0) > 0;
  const mediaLabel =
    post.hasPoll && !hasMedia ? 'Poll for members' : post.hasVideo ? 'Video for members' : (post.mediaCount ?? 0) > 1 ? `${post.mediaCount} photos for members` : 'Photo for members';
  return (
    <button onClick={onOpen} className="block w-full rounded-2xl border border-white/10 bg-navy-800/60 p-4 text-left transition-colors hover:border-orange-500/30 sm:p-5">
      <div className="flex items-center gap-3">
        <UserAvatar user={post.author} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{post.author?.name}</p>
          <p className="text-xs text-white/45">{new Date(post.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-bold text-orange-300">
          <Lock size={11} /> Members only
        </span>
      </div>
      {post.text && (
        <p
          className="mt-3 line-clamp-2 text-sm leading-relaxed text-white/80"
          style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 35%, transparent)', maskImage: 'linear-gradient(to bottom, black 35%, transparent)' }}
        >
          {post.text}
        </p>
      )}
      {(hasMedia || post.hasPoll) && (
        <div className="relative mt-3 h-40 overflow-hidden rounded-xl">
          {post.teaserImage ? (
            <img src={post.teaserImage} alt="" className="h-full w-full scale-110 object-cover blur-xl" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-orange-500/30 to-pink-600/30" />
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-orange-500 shadow-lg">
              <Lock size={20} />
            </span>
            <span className="text-sm font-bold text-white drop-shadow">{mediaLabel}</span>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
        <span>❤ {post.likeCount}</span>
        <span>💬 {post.commentCount}</span>
        <span className="ml-auto font-bold text-orange-400">Join to read ›</span>
      </div>
    </button>
  );
}

/** After the locked previews: "+28 more posts", what members get, and the plans. */
function UnlockCard({ community, rest, paidTotal, canBuy, onOpen }: { community: ApiCommunity; rest: number; paidTotal: number; canBuy: boolean; onOpen: () => void }) {
  const plans = community.planOptions || [];
  const cheapest = plans.length ? plans.reduce((a, b) => (b.price < a.price ? b : a)) : null;
  const highlights = [
    { icon: Users2, value: community.memberCount.toLocaleString('en-IN'), label: 'members' },
    { icon: ScrollText, value: paidTotal.toLocaleString('en-IN'), label: 'member posts' },
    ...(community.chatEnabled ? [{ icon: MessagesSquare, value: 'Live', label: 'group chat' }] : []),
    { icon: Crown, value: 'All', label: 'community lives' },
  ];
  return (
    <div className="rounded-[22px] bg-gradient-to-r from-[#F4511E] to-[#EC2A78] p-[1.5px] shadow-lg shadow-pink-500/15">
      <div className="rounded-[21px] bg-navy-800 px-5 py-6 text-center">
        <p className="bg-gradient-to-r from-[#F4511E] to-[#EC2A78] bg-clip-text text-5xl font-black tracking-tight text-transparent">
          {rest > 0 ? `+${rest.toLocaleString('en-IN')}` : paidTotal.toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-base font-bold text-white">
          {rest > 0 ? `more ${rest === 1 ? 'post' : 'posts'} unlock with a plan` : `members-only ${paidTotal === 1 ? 'post' : 'posts'} unlock with a plan`}
        </p>
        <p className="mt-0.5 text-xs text-white/50">Read every post, join the chat and watch the lives in {community.name}.</p>
        <div className="mt-4 grid rounded-2xl bg-white/[0.04] py-3" style={{ gridTemplateColumns: `repeat(${highlights.length}, minmax(0, 1fr))` }}>
          {highlights.map((h, i) => (
            <div key={h.label} className={cn('flex flex-col items-center gap-0.5 px-1', i > 0 && 'border-l border-white/10')}>
              <h.icon size={17} className="text-orange-400" />
              <span className="text-sm font-extrabold text-white">{h.value}</span>
              <span className="truncate text-[11px] text-white/45">{h.label}</span>
            </div>
          ))}
        </div>
        {plans.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {plans.map((p) => (
              <span
                key={p.key}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-bold',
                  p.key === cheapest?.key ? 'border-orange-500/40 bg-orange-500/10 text-orange-300' : 'border-white/10 text-white/70'
                )}
              >
                {p.key === 'lifetime' ? 'One-time' : p.label} · {rupees(p.price)}
                {p.key === 'lifetime' ? '' : PLAN_SUFFIX[p.key]}
              </span>
            ))}
          </div>
        )}
        {canBuy && (
          <button
            onClick={onOpen}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#F4511E] to-[#EC2A78] px-5 py-3 text-sm font-bold text-white"
          >
            <Lock size={15} /> {cheapest ? `Unlock from ${rupees(cheapest.price)}` : 'Unlock everything'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function CommunityDetail() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const [community, setCommunity] = useState<ApiCommunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState(false);
  const [joinBusy, setJoinBusy] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [logoOpen, setLogoOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [postSort, setPostSort] = useState<'new' | 'top'>('new');
  const [postPage, setPostPage] = useState(1);
  const [postPages, setPostPages] = useState(1);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState('');
  // Paid community without a plan: only the free posts come back.
  const [lockedCount, setLockedCount] = useState(0);

  const loadCommunity = () =>
    communityApi
      .getBySlug(slug)
      .then(setCommunity)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));

  useEffect(() => {
    setLoading(true);
    setError('');
    setTab('posts');
    loadCommunity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, isAuthenticated]);

  const isMember = community?.membership?.status === 'active';
  const canView = Boolean(community && ((community.visibility === 'public' && !community.isPaid) || isMember));
  const mustPay = Boolean(community && needsPlan(community));
  // Paid community, no plan (not banned): read the free posts only.
  const previewOnly = Boolean(community && community.isPaid && !isMember && community.membership?.status !== 'banned');

  const loadPosts = (page = 1) => {
    if (!community) return;
    setPostsLoading(true);
    setPostsError('');
    communityApi
      .posts(community._id, { page, sort: postSort })
      .then((res) => {
        // No plan: up to 2 locked previews come after the free posts.
        const items = [...res.posts, ...(res.locked ?? [])];
        setPosts((prev) => (page === 1 ? items : [...prev, ...items]));
        setPostPage(res.page);
        setPostPages(res.pages);
        setLockedCount(res.lockedCount ?? 0);
      })
      .catch((err) => setPostsError(getApiErrorMessage(err)))
      .finally(() => setPostsLoading(false));
  };

  useEffect(() => {
    if ((canView || previewOnly) && tab === 'posts') loadPosts(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [community?._id, canView, previewOnly, postSort, tab]);

  const toggleJoin = async () => {
    if (!community) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (mustPay) {
      setPlansOpen(true);
      return;
    }
    if (
      isMember &&
      !window.confirm(
        community.membership?.access === 'paid'
          ? `Leave ${community.name}? You’ll lose the time left on your plan — joining again means paying again.`
          : `Leave ${community.name}?`
      )
    )
      return;
    setJoinBusy(true);
    try {
      await communityApi.toggleJoin(community._id);
      await loadCommunity();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setJoinBusy(false);
    }
  };

  const toggleMute = async () => {
    if (!community?.membership) return;
    const muted = !community.membership.notificationsMuted;
    await communityApi.setMuted(community._id, muted).catch(() => {});
    setCommunity({ ...community, membership: { ...community.membership, notificationsMuted: muted } });
  };

  const deleteCommunity = async () => {
    if (!community || !window.confirm(`Delete ${community.name}? All posts, comments and chat will be removed.`)) return;
    try {
      await communityApi.remove(community._id);
      navigate('/communities');
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-28 text-white/50">
        <Loader2 size={28} className="animate-spin" />
      </div>
    );
  }

  if (!community) {
    return (
      <div className="pt-28 pb-24">
        <Container className="flex flex-col items-center gap-3 text-center text-white/60">
          <AlertCircle size={28} className="text-red-400" />
          <p>{error || 'Community not found'}</p>
          <Link to="/communities" className="text-sm font-semibold text-orange-300">
            Back to communities
          </Link>
        </Container>
      </div>
    );
  }

  const status = community.membership?.status;
  const joinLabel = mustPay
    ? `${status === 'expired' ? 'Renew' : 'Join'} · ${communityPriceLabel(community)}`
    : isMember
      ? 'Leave'
      : status === 'pending'
        ? 'Cancel request'
        : status === 'expired'
          ? 'Join again'
          : community.visibility === 'private'
            ? 'Request to join'
            : 'Join community';

  // Paid membership info for the strip under the description.
  const m = community.membership;
  const paidLine = community.isOwner && community.isPaid
    ? `Paid community · ${rupees(community.paidStats?.revenue ?? 0)} earned from ${community.paidStats?.payments ?? 0} payments — goes to your wallet`
    : status === 'expired'
      ? 'Your membership ended — renew to get back into posts, chat and lives.'
      : isMember && m?.access === 'paid'
        ? m.plan === 'lifetime' || !m.paidUntil
          ? 'Lifetime member — you paid once.'
          : `${m.plan === 'yearly' ? 'Yearly' : 'Monthly'} member · active till ${new Date(m.paidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
        : isMember && community.isPaid
          ? 'You have free access — you joined before this community went paid.'
          : '';
  const showRenew =
    status === 'expired' ||
    Boolean(isMember && m?.access === 'paid' && m.plan !== 'lifetime' && m.paidUntil && new Date(m.paidUntil).getTime() - Date.now() < 7 * 86400000);

  const tabs: { key: Tab; label: string; icon: typeof Users2; hidden?: boolean; badge?: number }[] = [
    { key: 'posts', label: 'Posts', icon: ScrollText },
    { key: 'chat', label: 'Chat', icon: MessagesSquare, hidden: !isMember || !community.chatEnabled },
    { key: 'members', label: 'Members', icon: Users2, badge: community.canModerate ? community.pendingRequestCount : undefined },
    { key: 'about', label: 'About', icon: Crown },
  ];

  const locked = community.isPaid ? (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/60 px-6 py-12 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F4511E] to-[#EC2A78] text-white shadow-lg shadow-orange-500/25">
        <Crown size={28} />
      </span>
      <p className="text-lg font-bold text-white">{status === 'expired' ? 'Your membership ended' : 'Members-only community'}</p>
      <p className="max-w-sm text-sm text-white/55">
        {status === 'expired' ? 'Renew to get back into the posts, chat and lives.' : 'Get a plan to read posts, join the chat and watch community lives.'}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {(community.planOptions || []).map((p) => (
          <span key={p.key} className="rounded-full bg-orange-500/10 px-3 py-1.5 text-xs font-bold text-orange-300">
            {p.key === 'lifetime' ? 'One-time' : p.label} · {rupees(p.price)}
            {p.key === 'lifetime' ? '' : PLAN_SUFFIX[p.key]}
          </span>
        ))}
      </div>
      {status !== 'banned' && (
        <button
          onClick={() => (isAuthenticated ? setPlansOpen(true) : navigate('/login'))}
          className="mt-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#F4511E] to-[#EC2A78] px-5 py-2.5 text-sm font-bold text-white"
        >
          <Crown size={15} /> {isAuthenticated ? (status === 'expired' ? 'Renew membership' : 'See plans') : 'Log in to join'}
        </button>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/60 px-6 py-14 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.06] text-white/60">
        <Lock size={24} />
      </span>
      <p className="font-bold text-white">This community is private</p>
      <p className="max-w-sm text-sm text-white/55">
        {status === 'pending' ? 'Your request is waiting for approval.' : 'Request to join — a moderator will approve you.'}
      </p>
    </div>
  );

  return (
    <div className="pt-24 pb-24">
      <Container className="!max-w-5xl">
        <Link to="/communities" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/55 hover:text-white">
          <ArrowLeft size={15} /> Communities
        </Link>

        {/* Hero */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-navy-800/60">
          {/* Full cover, never cropped — tap to view it large */}
          <button
            type="button"
            onClick={() => community.coverImageUrl && setCoverOpen(true)}
            className={cn('block w-full', community.coverImageUrl ? 'cursor-zoom-in' : 'cursor-default')}
            aria-label="View cover image"
          >
            <CommunityCover url={community.coverImageUrl} className="aspect-[3/1] w-full" />
          </button>
          <div className="relative px-5 pb-5 sm:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              {/* Only the icon overlaps the cover, so no text ever sits on the image */}
              {/* z-10 keeps the whole logo above the cover; tap to view it full size */}
              <button
                type="button"
                onClick={() => community.iconUrl && setLogoOpen(true)}
                aria-label={`View ${community.name} logo`}
                className={cn(
                  'relative z-10 -mt-11 rounded-2xl transition-transform sm:-mt-12',
                  community.iconUrl ? 'cursor-zoom-in hover:scale-105' : 'cursor-default'
                )}
              >
                <CommunityIcon iconUrl={community.iconUrl} name={community.name} size={88} className="border-4 border-navy-800 shadow-lifted" />
              </button>
              <div className="flex flex-wrap items-center gap-2 pt-3">
                {isMember && (
                  <button
                    onClick={toggleMute}
                    title={community.membership?.notificationsMuted ? 'Announcements muted' : 'Announcements on'}
                    className="rounded-xl bg-white/10 p-2.5 text-white/70 hover:bg-white/15"
                  >
                    {community.membership?.notificationsMuted ? <BellOff size={17} /> : <Bell size={17} />}
                  </button>
                )}
                {community.canModerate && (
                  <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2.5 text-sm font-bold text-white/80 hover:bg-white/15">
                    <Settings size={16} /> Settings
                  </button>
                )}
                {!community.isOwner && status !== 'banned' && (
                  <button
                    onClick={toggleJoin}
                    disabled={joinBusy}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold',
                      mustPay
                        ? 'bg-gradient-to-r from-[#F4511E] to-[#EC2A78] text-white hover:opacity-90'
                        : isMember || status === 'pending'
                          ? 'bg-white/10 text-white/80 hover:bg-white/15'
                          : 'bg-orange-500 text-white hover:bg-orange-600'
                    )}
                  >
                    {joinBusy && <Loader2 size={15} className="animate-spin" />}
                    {mustPay && !joinBusy && <Crown size={15} />}
                    {joinLabel}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white sm:text-3xl">{community.name}</h1>
              {community.isVerified && <BadgeCheck size={20} className="text-sky-400" />}
              {community.isPaid ? (
                <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-[#F4511E] to-[#EC2A78] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  <Crown size={11} /> Paid
                </span>
              ) : (
                community.visibility === 'private' && (
                  <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-white/65">
                    <Lock size={11} /> Private
                  </span>
                )
              )}
            </div>
            {community.description && <p className="mt-2 max-w-3xl text-sm text-white/65">{community.description}</p>}
            <p className="mt-2 text-xs text-white/45">
              {community.category?.label && `${community.category.label} · `}
              {community.memberCount.toLocaleString('en-IN')} members · {community.discussionCount.toLocaleString('en-IN')} posts
            </p>
            {status === 'banned' && <p className="mt-2 text-sm font-semibold text-red-400">You have been removed from this community.</p>}
            {paidLine && (
              <div className="mt-3 flex max-w-2xl items-center gap-3 rounded-xl border border-orange-500/25 bg-orange-500/[0.07] px-3.5 py-2.5">
                <Crown size={16} className="shrink-0 text-orange-300" />
                <p className="flex-1 text-sm text-white/80">{paidLine}</p>
                {showRenew && (
                  <button onClick={() => setPlansOpen(true)} className="shrink-0 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600">
                    Renew
                  </button>
                )}
              </div>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-t border-white/10 px-3 sm:px-6">
            {tabs
              .filter((t) => !t.hidden)
              .map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    'relative flex shrink-0 items-center gap-1.5 px-4 py-3.5 text-sm font-bold transition-colors',
                    tab === t.key ? 'text-white' : 'text-white/50 hover:text-white/80'
                  )}
                >
                  <t.icon size={15} /> {t.label}
                  {t.badge ? <span className="rounded-full bg-orange-500 px-1.5 text-[10px] text-white">{t.badge}</span> : null}
                  {tab === t.key && <motion.span layoutId="community-tab" className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-orange-500" />}
                </button>
              ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="mt-6">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
              {tab === 'posts' &&
                (previewOnly ? (
                  <div className="mx-auto max-w-2xl space-y-4">
                    {postsLoading && posts.length === 0 && (
                      <div className="flex justify-center py-6 text-white/40">
                        <Loader2 size={22} className="animate-spin" />
                      </div>
                    )}
                    {posts.some((p) => !p.isLocked) && (
                      <p className="flex items-center gap-1.5 text-sm font-bold text-white/80">
                        <Globe size={15} className="text-emerald-400" />
                        {posts.filter((p) => !p.isLocked).length === 1
                          ? 'Free post — read it without a plan'
                          : `${posts.filter((p) => !p.isLocked).length} free posts — read them without a plan`}
                      </p>
                    )}
                    {posts.filter((p) => !p.isLocked).map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        canInteract={false}
                        canModerate={false}
                        showFreeTag
                        onChange={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
                        onDelete={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
                      />
                    ))}
                    {posts.some((p) => p.isLocked) && (
                      <>
                        <p className="flex items-center gap-1.5 pt-2 text-sm font-bold text-white/80">
                          <Lock size={14} className="text-orange-400" /> Members-only posts
                        </p>
                        {posts
                          .filter((p) => p.isLocked)
                          .map((post) => (
                            <LockedPostCard key={post._id} post={post} onOpen={() => (isAuthenticated ? setPlansOpen(true) : navigate('/login'))} />
                          ))}
                      </>
                    )}
                    {posts.length > 0 && status !== 'expired' ? (
                      <UnlockCard
                        community={community}
                        rest={lockedCount}
                        paidTotal={Math.max(posts.filter((p) => p.isLocked).length, community.discussionCount - posts.filter((p) => !p.isLocked).length)}
                        canBuy={status !== 'banned'}
                        onOpen={() => (isAuthenticated ? setPlansOpen(true) : navigate('/login'))}
                      />
                    ) : (
                      locked
                    )}
                  </div>
                ) : !canView ? (
                  locked
                ) : (
                  <div className="mx-auto max-w-2xl space-y-4">
                    {community.canPost && (
                      <PostComposer community={community} onPosted={(post) => setPosts((prev) => [post, ...prev])} />
                    )}
                    {isMember && !community.canPost && (
                      <p className="rounded-xl bg-white/[0.04] px-4 py-3 text-sm text-white/55">Only the owner and moderators can post here.</p>
                    )}
                    {!isMember && status !== 'banned' && !mustPay && (
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3">
                        <p className="text-sm text-white/75">Join to post, comment, vote and chat.</p>
                        <button onClick={toggleJoin} className="rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-bold text-white">
                          {isAuthenticated ? 'Join community' : 'Log in to join'}
                        </button>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1">
                      {(['new', 'top'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setPostSort(s)}
                          className={cn('rounded-full px-3 py-1 text-xs font-bold', postSort === s ? 'bg-white/10 text-white' : 'text-white/45 hover:text-white')}
                        >
                          {s === 'new' ? 'Latest' : 'Top'}
                        </button>
                      ))}
                    </div>

                    {postsError && <p className="text-center text-sm text-red-400">{postsError}</p>}
                    {posts.map((post) => (
                      <PostCard
                        key={post._id}
                        post={post}
                        canInteract={isMember}
                        canModerate={community.canModerate}
                        showFreeTag={Boolean(community.isPaid && community.canModerate)}
                        canMarkFree={Boolean(community.isPaid && community.canModerate)}
                        onChange={(updated) => setPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
                        onDelete={(id) => setPosts((prev) => prev.filter((p) => p._id !== id))}
                      />
                    ))}
                    {postsLoading && (
                      <div className="flex justify-center py-6 text-white/40">
                        <Loader2 size={22} className="animate-spin" />
                      </div>
                    )}
                    {!postsLoading && posts.length === 0 && !postsError && (
                      <p className="py-10 text-center text-sm text-white/45">No posts yet — start the first discussion.</p>
                    )}
                    {!postsLoading && postPage < postPages && (
                      <button onClick={() => loadPosts(postPage + 1)} className="w-full rounded-xl bg-white/[0.05] py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10">
                        Load more posts
                      </button>
                    )}
                  </div>
                ))}

              {tab === 'chat' && isMember && community.chatEnabled && <CommunityChat community={community} />}

              {tab === 'members' && (canView ? <MembersPanel community={community} onChanged={loadCommunity} /> : locked)}

              {tab === 'about' && (
                <div className="grid gap-4 md:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
                    <h2 className="font-bold text-white">About</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-white/65">{community.description || 'No description yet.'}</p>
                    <h3 className="mt-6 font-bold text-white">Rules</h3>
                    {community.rules.length === 0 ? (
                      <p className="mt-2 text-sm text-white/45">No rules set.</p>
                    ) : (
                      <ol className="mt-2 space-y-2">
                        {community.rules.map((rule, i) => (
                          <li key={i} className="flex gap-2.5 rounded-xl bg-white/[0.04] px-3 py-2.5 text-sm text-white/80">
                            <span className="font-bold text-orange-300">{i + 1}</span> {rule}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5">
                      <h2 className="font-bold text-white">Team</h2>
                      <div className="mt-3 space-y-2.5">
                        {(community.moderators || []).map((m) => (
                          <div key={m.user._id} className="flex items-center gap-2.5">
                            <UserAvatar user={m.user} size={34} />
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-semibold text-white">{m.user.name}</p>
                              <p className="flex items-center gap-1 text-[11px] text-white/45">
                                {m.role === 'admin' ? <Crown size={11} className="text-yellow-400" /> : <ShieldCheck size={11} className="text-sky-400" />}
                                {m.role === 'admin' ? 'Owner' : 'Moderator'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-navy-800/60 p-5 text-sm text-white/60">
                      <p>Created {new Date(community.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="mt-1">
                        {community.isPaid
                          ? `Paid — ${(community.planOptions || []).map((p) => `${p.key === 'lifetime' ? 'One-time' : p.label} ${rupees(p.price)}`).join(' · ')}`
                          : community.visibility === 'private'
                            ? 'Private — members approved by moderators'
                            : 'Public — anyone can join'}
                      </p>
                      <p className="mt-1">{community.postPermission === 'all' ? 'All members can post' : 'Only owner & moderators post'}</p>
                    </div>
                    {community.isOwner && (
                      <button
                        onClick={deleteCommunity}
                        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-500/30 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 size={15} /> Delete community
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </Container>

      <CommunityFormModal open={editing} onClose={() => setEditing(false)} community={community} onSaved={() => loadCommunity()} />
      <PaidPlansModal open={plansOpen} community={community} onClose={() => setPlansOpen(false)} onJoined={() => loadCommunity()} />

      {logoOpen && community.iconUrl && (
        <ImageLightbox url={community.iconUrl} alt={`${community.name} logo`} onClose={() => setLogoOpen(false)} />
      )}

      <AnimatePresence>
        {coverOpen && community.coverImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCoverOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          >
            <button onClick={() => setCoverOpen(false)} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" aria-label="Close">
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              src={community.coverImageUrl}
              alt={`${community.name} cover`}
              className="max-h-[90vh] max-w-full rounded-xl object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
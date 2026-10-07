import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, BadgeCheck, Flame, Loader2, Lock, MessagesSquare, Plus, Search, Sparkles, TrendingUp, Users2 } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CommunityFormModal } from '@/components/community/CommunityFormModal';
import { CommunityCover, CommunityIcon, ImageLightbox } from '@/components/community/CommunityAvatar';
import { communityPriceLabel, needsPlan, communityApi, type ApiCommunity, type CommunitySort } from '@/services/communityApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

type Tab = 'discover' | 'mine';

const SORTS: { key: CommunitySort; label: string; icon: typeof Flame }[] = [
  { key: 'trending', label: 'Trending', icon: Flame },
  { key: 'popular', label: 'Popular', icon: TrendingUp },
  { key: 'new', label: 'New', icon: Sparkles },
];

export default function Communities() {
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const [tab, setTab] = useState<Tab>('discover');
  const [sort, setSort] = useState<CommunitySort>('trending');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const load = (nextPage = 1) => {
    setLoading(true);
    setError('');
    const request =
      tab === 'mine'
        ? communityApi.getMine().then((list) => ({ communities: list, page: 1, pages: 1 }))
        : communityApi.list({ sort, search: search || undefined, category: category || undefined, page: nextPage });
    request
      .then((res) => {
        setCommunities((prev) => (nextPage === 1 ? res.communities : [...prev, ...res.communities]));
        setPage(res.page);
        setPages(res.pages);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const handle = window.setTimeout(() => load(1), search ? 300 : 0);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, sort, search, category, isAuthenticated]);

  const navigate = useNavigate();
  const handleJoin = async (c: ApiCommunity) => {
    if (!isAuthenticated) return;
    // Paid community: plans and payment are on its page.
    if (needsPlan(c)) {
      navigate(`/communities/${c.slug}`);
      return;
    }
    setBusyId(c._id);
    try {
      const res = await communityApi.toggleJoin(c._id);
      setCommunities((prev) =>
        prev.map((x) =>
          x._id === c._id
            ? {
                ...x,
                membership: res.status ? { role: 'member', status: res.status, notificationsMuted: false } : null,
                memberCount: x.memberCount + (res.joined ? 1 : c.membership?.status === 'active' ? -1 : 0),
              }
            : x
        )
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="pt-28 pb-24">
      <Container>
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-orange-500/15 via-navy-800/60 to-pink-500/10 p-6 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-300">
                <Users2 size={13} /> Communities
              </span>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">Find your people</h1>
              <p className="mt-2 max-w-lg text-white/60">Join creator and brand communities, share your work, run polls and chat live.</p>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setCreating(true)}
                className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white shadow-glow hover:bg-orange-600"
              >
                <Plus size={16} /> Create community
              </button>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1 rounded-full bg-white/[0.05] p-1">
            {(['discover', ...(isAuthenticated ? ['mine'] : [])] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn('rounded-full px-4 py-1.5 text-sm font-bold', tab === t ? 'bg-orange-500 text-white' : 'text-white/55 hover:text-white')}
              >
                {t === 'discover' ? 'Discover' : 'My communities'}
              </button>
            ))}
          </div>

          {tab === 'discover' && (
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <label className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search communities"
                  className="w-full rounded-full border border-white/10 bg-navy-800/60 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-orange-400 focus:outline-none"
                />
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-full border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white focus:border-orange-400 focus:outline-none"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {tab === 'discover' && (
          <div className="mt-4 flex gap-2">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSort(s.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors',
                  sort === s.key ? 'border-orange-400/60 bg-orange-500/10 text-orange-200' : 'border-white/10 text-white/55 hover:text-white'
                )}
              >
                <s.icon size={13} /> {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {loading && communities.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading communities…</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && communities.length === 0 && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/50">
            <Users2 size={30} />
            <p>{tab === 'mine' ? "You haven't joined any community yet." : 'No communities found — start the first one.'}</p>
          </div>
        )}

        {communities.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c, i) => (
              <motion.div
                key={c._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: (i % 9) * 0.04 }}
              >
                <CommunityCard community={c} busy={busyId === c._id} canJoin={isAuthenticated} onJoin={() => handleJoin(c)} />
              </motion.div>
            ))}
          </div>
        )}

        {tab === 'discover' && page < pages && (
          <div className="mt-8 flex justify-center">
            <button onClick={() => load(page + 1)} disabled={loading} className="rounded-full bg-white/10 px-5 py-2 text-sm font-semibold text-white/80 hover:bg-white/15">
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </Container>

      <CommunityFormModal open={creating} onClose={() => setCreating(false)} onSaved={() => { setTab('mine'); load(1); }} />
    </div>
  );
}

function CommunityCard({ community: c, busy, canJoin, onJoin }: { community: ApiCommunity; busy: boolean; canJoin: boolean; onJoin: () => void }) {
  const status = c.membership?.status;
  const mustPay = needsPlan(c);
  const joinLabel = mustPay
    ? `${status === 'expired' ? 'Renew' : 'Join'} · ${communityPriceLabel(c)}`
    : status === 'active'
      ? 'Joined'
      : status === 'pending'
        ? 'Requested'
        : c.visibility === 'private'
          ? 'Request'
          : 'Join';
  const [logoOpen, setLogoOpen] = useState(false);

  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 transition-colors hover:border-orange-400/30">
      <Link to={`/communities/${c.slug}`} className="block">
        <CommunityCover url={c.coverImageUrl} className="aspect-[3/1] w-full">
          {c.isFeatured && (
            <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-yellow-300">Featured</span>
          )}
        </CommunityCover>
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4">
        <div className="flex items-end justify-between">
          {/* z-10 keeps the whole logo above the cover (the cover image is
              absolutely positioned and was painting over its top half). */}
          {c.iconUrl ? (
            <button
              type="button"
              onClick={() => setLogoOpen(true)}
              aria-label={`View ${c.name} logo`}
              className="relative z-10 -mt-7 cursor-zoom-in rounded-2xl transition-transform hover:scale-105"
            >
              <CommunityIcon iconUrl={c.iconUrl} name={c.name} size={56} className="border-4 border-navy-800" />
            </button>
          ) : (
            <Link to={`/communities/${c.slug}`} className="relative z-10 -mt-7">
              <CommunityIcon iconUrl={c.iconUrl} name={c.name} size={56} className="border-4 border-navy-800" />
            </Link>
          )}
          {(c.unreadChatCount ?? 0) > 0 && (
            <span className="mb-1 flex items-center gap-1 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">
              <MessagesSquare size={11} /> {c.unreadChatCount}
            </span>
          )}
        </div>
        <Link to={`/communities/${c.slug}`} className="mt-2 flex items-center gap-1.5">
          <p className="truncate font-bold text-white group-hover:text-orange-200">{c.name}</p>
          {c.isVerified && <BadgeCheck size={15} className="shrink-0 text-sky-400" />}
          {c.isPaid ? (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-[#F4511E] to-[#EC2A78] px-1.5 py-0.5 text-[9px] font-black uppercase text-white">Paid</span>
          ) : (
            c.visibility === 'private' && <Lock size={13} className="shrink-0 text-white/40" />
          )}
        </Link>
        {c.category && <p className="text-xs text-white/45">{c.category.label}</p>}
        {c.description && <p className="mt-2 line-clamp-2 text-sm text-white/60">{c.description}</p>}
        <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-xs text-white/50">
            {c.memberCount.toLocaleString('en-IN')} members · {c.discussionCount.toLocaleString('en-IN')} posts
          </span>
          {canJoin && c.membership?.role !== 'admin' && (
            <button
              onClick={onJoin}
              disabled={busy}
              className={cn(
                'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold',
                mustPay
                  ? 'bg-gradient-to-r from-[#F4511E] to-[#EC2A78] text-white hover:opacity-90'
                  : status
                    ? 'bg-white/10 text-white/70 hover:bg-white/15'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
              )}
            >
              {busy && <Loader2 size={12} className="animate-spin" />}
              {joinLabel}
            </button>
          )}
        </div>
      </div>
      {logoOpen && c.iconUrl && <ImageLightbox url={c.iconUrl} alt={`${c.name} logo`} onClose={() => setLogoOpen(false)} />}
    </div>
  );
}
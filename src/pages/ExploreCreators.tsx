import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Search, Star, Sparkles, MapPin, Grid3x3, List, SlidersHorizontal, Crown, Wand2, Calendar as CalendarIcon, ArrowUpDown, Users, Briefcase, Clock, CheckCircle2, Languages as LanguagesIcon, ArrowUpRight } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { subscriptionApi } from '@/services/subscriptionApi';
import { ProfileLockedModal } from '@/components/ProfileLockedModal';
import { resolveIcon } from '@/utils/icons';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

type SortOption = 'relevance' | 'rating' | 'followers';

// Cover-photo style card for the Grid view — big photo across the top
// (like a poster), everything else stacked below it. Only 2 skills shown
// here (+ a "+N more" badge); the rest are visible on the full profile
// page (View Profile).
function CreatorGridCard({ creator, onCardClick }: { creator: ApiCreator; onCardClick: (e: React.MouseEvent, creator: ApiCreator) => void }) {
  const CategoryIcon = creator.category?.icon ? resolveIcon(creator.category.icon) : null;

  // Every card renders exactly 4 stat slots (a fixed 2x2 block), one
  // fixed-height skills row, and an always-visible footer line — no
  // matter how much data a given creator actually has. A variable-length
  // list is what was leaving blank space at the bottom of shorter cards;
  // backfilling missing slots with same-size invisible placeholders makes
  // every card in the row come out identically tall with nothing empty.
  const statNodes: React.ReactNode[] = [];
  if (creator.averageRating > 0) {
    statNodes.push(
      <span key="rating" className="flex items-center gap-1 rounded-lg bg-yellow-400/10 px-2 py-1 text-[11px] font-bold leading-tight text-yellow-300">
        <Star size={11} className="shrink-0" fill="currentColor" /> {creator.averageRating} <span className="font-normal text-yellow-300/60">({creator.reviewCount})</span>
      </span>
    );
  }
  if (creator.followerCount > 0) {
    statNodes.push(
      <span key="followers" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] leading-tight text-white/60">
        <Users size={11} className="shrink-0 text-white/40" /> {creator.followerCount.toLocaleString('en-IN')}
      </span>
    );
  }
  if (creator.yearsOfExperience != null && creator.yearsOfExperience > 0) {
    statNodes.push(
      <span key="exp" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] leading-tight text-white/60">
        <Briefcase size={11} className="shrink-0 text-white/40" /> {creator.yearsOfExperience}+ yrs exp
      </span>
    );
  }
  if (creator.onTimeDeliveryPercent != null) {
    statNodes.push(
      <span key="ontime" className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold leading-tight text-emerald-300">
        <CheckCircle2 size={11} className="shrink-0" /> {creator.onTimeDeliveryPercent}% on-time
      </span>
    );
  }
  if (creator.responseTime) {
    statNodes.push(
      <span key="response" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] leading-tight text-white/60">
        <Clock size={11} className="shrink-0 text-white/40" /> {creator.responseTime}
      </span>
    );
  }
  if (creator.languages && creator.languages.length > 0) {
    statNodes.push(
      <span key="lang" className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-[11px] leading-tight text-white/60">
        <LanguagesIcon size={11} className="shrink-0 text-white/40" /> {creator.languages.join(', ')}
      </span>
    );
  }
  const visibleStats = statNodes.slice(0, 4);
  while (visibleStats.length < 4) {
    visibleStats.push(
      <span key={`stat-placeholder-${visibleStats.length}`} className="invisible rounded-lg px-2 py-1 text-[11px] leading-tight">
        —
      </span>
    );
  }

  return (
    <Link
      to={`/creator/${creator.slug}`}
      onClick={(e) => onCardClick(e, creator)}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 shadow-card transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-500/30 hover:shadow-lifted"
    >
      {/* Big cover photo */}
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden">
        <img
          src={creator.user.avatarUrl || `https://i.pravatar.cc/500?u=${creator._id}`}
          alt={creator.user.name}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/95 via-navy-900/20 to-transparent" />

        {(creator.isTopCreator || creator.isProPlan) && (
          <span
            className={cn(
              'absolute right-3 top-3 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm',
              creator.isTopCreator ? 'bg-yellow-400/20 text-yellow-300' : 'bg-orange-500/20 text-orange-300'
            )}
          >
            {creator.isTopCreator ? 'Top Creator' : <><Crown size={10} /> Pro</>}
          </span>
        )}
        <span
          className={cn(
            'absolute left-3 top-3 h-3 w-3 rounded-full border-2 border-white/80',
            creator.isAvailableForWork !== false ? 'bg-emerald-400' : 'bg-white/30'
          )}
        />

        {/* View-profile affordance — the whole card is already a link, this
            just makes that obvious at a glance. Brightens to solid brand
            orange on hover/focus so it reads as an actionable control. */}
        <span
          title="View full profile"
          className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white ring-1 ring-inset ring-white/25 backdrop-blur-sm transition-all duration-300 ease-out group-hover:bg-orange-500 group-hover:ring-orange-400/60"
        >
          <ArrowUpRight size={15} />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <p className="line-clamp-1 text-base font-bold text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.6)]">{creator.user.name}</p>
          {(creator.title || creator.category?.label) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]">
              {CategoryIcon && <CategoryIcon size={11} className="shrink-0" />}
              <span className="line-clamp-1">{creator.title || creator.category?.label}</span>
            </p>
          )}
        </div>
      </div>

      {/* Details below the photo */}
      <div className="flex flex-1 flex-col p-3.5">
        {/* Location — always renders one line of height; if missing, the
            text is just invisible rather than the line disappearing. */}
        <p className={cn('flex items-center gap-1 text-xs text-white/40', !creator.location && 'invisible')}>
          <MapPin size={11} className="shrink-0" /> <span className="truncate">{creator.location || '—'}</span>
        </p>

        {/* Stat pills — always exactly 4 slots (a fixed 2x2 grid), so this
            block is the same height on every card. */}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">{visibleStats}</div>

        {/* Skills — capped at 2 visible pills + a "+N more" badge (the
            full list lives on the profile page). flex-nowrap + overflow
            hidden means this can never wrap to a second line, so the row
            is a fixed height on every card, skills or not. */}
        <div className="mt-3 flex min-h-[34px] flex-nowrap items-center gap-1.5 overflow-hidden">
          {creator.skills && creator.skills.length > 0 ? (
            <>
              {creator.skills.slice(0, 2).map((skill) => (
                <span
                  key={skill}
                  title={skill}
                  className="max-w-[42%] shrink-0 truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-white/70"
                >
                  {skill}
                </span>
              ))}
              {creator.skills.length > 2 && (
                <span className="shrink-0 rounded-lg border border-orange-400/25 bg-orange-500/10 px-2.5 py-1.5 text-[11px] font-bold leading-tight text-orange-300">
                  +{creator.skills.length - 2} more
                </span>
              )}
            </>
          ) : (
            <span className="shrink-0 rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white/25">No skills listed yet</span>
          )}
        </div>

      </div>
    </Link>
  );
}

export default function ExploreCreators() {
  const [creators, setCreators] = useState<ApiCreator[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [searchParams] = useSearchParams();
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'All');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [location, setLocation] = useState('');
  const [locating, setLocating] = useState(false);
  const [availability, setAvailability] = useState<'any' | 'available'>('any');
  const [skillFilter, setSkillFilter] = useState('All');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  const authUser = useAppSelector((s) => s.auth.user);
  const [viewerIsLite, setViewerIsLite] = useState(false);
  const [profileLockedOpen, setProfileLockedOpen] = useState(false);

  // Only creators/brands have a plan to check — a Lite one gets gated
  // from opening a Pro creator's profile (see handleCardClick below).
  useEffect(() => {
    if (!authUser || (authUser.role !== 'creator' && authUser.role !== 'brand')) {
      setViewerIsLite(false);
      return;
    }
    subscriptionApi
      .getMySubscription()
      .then((sub) => setViewerIsLite(sub.plan.price === 0))
      .catch(() => setViewerIsLite(false));
  }, [authUser]);

  const handleCardClick = (e: React.MouseEvent, creator: ApiCreator) => {
    if (viewerIsLite && creator.isProPlan) {
      e.preventDefault();
      setProfileLockedOpen(true);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      setPage(1);
      creatorApi
        .list({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          search: search || undefined,
          location: location || undefined,
          page: 1,
          limit: 60,
        })
        .then((d) => {
          if (cancelled) return;
          setCreators(d.creators);
          setTotalPages(d.pages);
        })
        .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
        .finally(() => !cancelled && setLoading(false));
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [categoryFilter, search, location]);

  // Point-Fix: the backend was always defaulting to a 20-creator page
  // with no way for the frontend to reach page 2+ — "All" (which has far
  // more than 20 creators total) looked broken/incomplete, while a
  // narrow category with under 20 matches happened to show everything
  // and looked "correct" by comparison. Load More now actually appends
  // further pages instead of silently capping at the first one.
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setLoadingMore(true);
    creatorApi
      .list({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        search: search || undefined,
        location: location || undefined,
        page: nextPage,
        limit: 60,
      })
      .then((d) => {
        setCreators((prev) => [...prev, ...d.creators]);
        setPage(nextPage);
        setTotalPages(d.pages);
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoadingMore(false));
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const city = data.city || data.locality || data.principalSubdivision;
          if (city) setLocation(city);
        } catch {
          // silently ignore — network/geocode failures just leave location filter untouched
        } finally {
          setLocating(false);
        }
      },
      () => setLocating(false)
    );
  };

  const visibleCreators = useMemo(() => {
    let list = creators.filter((c) => c.user);
    if (availability === 'available') list = list.filter((c) => c.isAvailableForWork !== false);
    if (skillFilter !== 'All') list = list.filter((c) => c.skills?.includes(skillFilter));
    if (sortBy === 'rating') list.sort((a, b) => b.averageRating - a.averageRating);
    if (sortBy === 'followers') list.sort((a, b) => b.followerCount - a.followerCount);
    return list;
  }, [creators, availability, skillFilter, sortBy]);

  // Real skill options, derived from the creators currently loaded — not a fabricated list.
  const skillOptions = useMemo(() => {
    const set = new Set<string>();
    creators.forEach((c) => c.skills?.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [creators]);

  const quickCategories = categories.slice(0, 5);
  const hasActiveFilters = Boolean(location) || availability !== 'any' || sortBy !== 'relevance' || skillFilter !== 'All';

  return (
    <div className="relative pt-28 pb-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 hidden h-72 overflow-hidden lg:block">
        <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-orange-500/10 blur-[110px]" />
        <div className="absolute right-1/4 top-0 h-72 w-72 rounded-full bg-pink-500/10 blur-[110px]" />
      </div>
      <Container>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Home &gt; Creators</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Discover <span className="brand-gradient-text">Creators</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/60 sm:mt-2 sm:text-base">Find creators that match your style, skills and project needs.</p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <p className="hidden -rotate-3 font-display text-sm italic leading-tight text-orange-400/70 lg:block">
              Real People
              <br />
              Real Content
              <br />
              Real Impact
            </p>
            <button
              onClick={() => (location ? setLocation('') : handleUseMyLocation())}
              disabled={locating}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/60 px-4 py-3 text-left shadow-card transition-all duration-200 ease-out hover:border-orange-400/40 disabled:opacity-60"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-300">
                {locating ? <Loader2 size={16} className="animate-spin" /> : <Crown size={16} />}
              </span>
              <span>
                <span className="block text-sm font-bold text-white">Use My Location</span>
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <MapPin size={10} /> {location ? `Showing near ${location}` : 'Get local creators near you'}
                </span>
              </span>
              <span
                className={cn(
                  'ml-1 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200',
                  location ? 'bg-orange-500' : 'bg-white/15'
                )}
              >
                <span className={cn('h-5 w-5 rounded-full bg-white shadow-soft transition-transform duration-200', location && 'translate-x-5')} />
              </span>
            </button>
          </div>
        </div>

        {/* Search + Filters toggle */}
        <div className="mt-5 flex gap-2 sm:mt-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, skills, category..."
              className="w-full rounded-xl border border-white/10 bg-navy-800/60 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              'relative flex shrink-0 items-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold sm:hidden',
              filtersOpen ? 'border-orange-400/60 bg-orange-500/10 text-orange-300' : 'border-white/10 bg-navy-800/60 text-white/70'
            )}
          >
            <SlidersHorizontal size={15} /> Filters
            {hasActiveFilters && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-orange-500" />}
          </button>
        </div>

        {/* Quick type chips — horizontal scroll on all breakpoints */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setCategoryFilter('All')}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
              categoryFilter === 'All' ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-navy-800/45 text-white/60 hover:border-white/20'
            )}
          >
            All Creators
          </button>
          {quickCategories.map((c) => (
            <button
              key={c._id}
              onClick={() => setCategoryFilter(c._id)}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                categoryFilter === c._id ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-navy-800/45 text-white/60 hover:border-white/20'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Filter bar — collapsed by default on mobile behind the Filters button, always visible from sm up */}
        <div className={cn('mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5', filtersOpen ? 'grid' : 'hidden sm:grid')}>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-white/40"><MapPin size={11} /> Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Anywhere"
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-white/40"><Grid3x3 size={11} /> Category</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white focus:border-orange-400"
            >
              <option value="All" className="bg-[#141414]">All</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id} className="bg-[#141414]">{c.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-white/40"><Wand2 size={11} /> Skills</span>
            <select
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white focus:border-orange-400"
            >
              <option value="All" className="bg-[#141414]">All</option>
              {skillOptions.map((s) => (
                <option key={s} value={s} className="bg-[#141414]">{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-white/40"><CalendarIcon size={11} /> Availability</span>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as 'any' | 'available')}
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white focus:border-orange-400"
            >
              <option value="any" className="bg-[#141414]">Anytime</option>
              <option value="available" className="bg-[#141414]">Available now</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase text-white/40"><ArrowUpDown size={11} /> Sort By</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white focus:border-orange-400"
            >
              <option value="relevance" className="bg-[#141414]">Relevance</option>
              <option value="rating" className="bg-[#141414]">Top Rated</option>
              <option value="followers" className="bg-[#141414]">Most Followers</option>
            </select>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between sm:mt-6">
          <p className="text-sm text-white/50">{visibleCreators.length.toLocaleString('en-IN')} Creators Found</p>
          <div className="flex gap-1 rounded-lg border border-white/10 bg-navy-800/50 p-1">
            <button
              onClick={() => setView('grid')}
              className={cn('rounded-md p-1.5', view === 'grid' ? 'bg-orange-500/20 text-orange-300' : 'text-white/40 hover:text-white/70')}
              aria-label="Grid view"
            >
              <Grid3x3 size={16} />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn('rounded-md p-1.5', view === 'list' ? 'bg-orange-500/20 text-orange-300' : 'text-white/40 hover:text-white/70')}
              aria-label="List view"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading creators...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load creators — {error}</p>
          </div>
        )}

        {!loading && !error && visibleCreators.length === 0 && (
          <p className="mt-16 text-center text-white/50">No creators match these filters yet.</p>
        )}

        {!loading && !error && visibleCreators.length > 0 && view === 'grid' && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {visibleCreators.map((creator, i) => (
              <motion.div
                key={creator._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 12) * 0.05 }}
                className="h-full"
              >
                <CreatorGridCard creator={creator} onCardClick={handleCardClick} />
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && visibleCreators.length > 0 && view === 'list' && (
          <div className="mt-6 space-y-3">
            {visibleCreators.map((creator, i) => {
              const CategoryIcon = creator.category?.icon ? resolveIcon(creator.category.icon) : null;
              return (
                <motion.div
                  key={creator._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: (i % 10) * 0.04 }}
                  className="relative"
                >
                  <Link
                    to={`/creator/${creator.slug}`}
                    onClick={(e) => handleCardClick(e, creator)}
                    className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-lifted sm:gap-4 sm:p-4"
                  >
                    <div className="relative shrink-0">
                      <img
                        src={creator.user.avatarUrl || `https://i.pravatar.cc/200?u=${creator._id}`}
                        alt={creator.user.name}
                        className="h-16 w-14 rounded-lg object-cover sm:h-20 sm:w-16"
                      />
                      {creator.isAvailableForWork !== false && (
                        <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-navy-900 bg-emerald-400 sm:h-3.5 sm:w-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-white sm:text-base">{creator.user.name}</p>
                        <span
                          className={cn(
                            'flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold',
                            creator.isProPlan ? 'bg-orange-500/15 text-orange-300' : 'bg-white/10 text-white/50'
                          )}
                        >
                          {creator.isProPlan && <Sparkles size={10} />}
                          {creator.planName || 'Lite'}
                        </span>
                        <span className="shrink-0 whitespace-nowrap rounded-full border border-orange-400/40 px-3 py-1 text-[11px] font-bold text-orange-300">
                          View
                        </span>
                      </div>
                      {(creator.title || creator.category?.label) && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/50 sm:text-sm">
                          {CategoryIcon && <CategoryIcon size={11} className="shrink-0" />}
                          <span className="truncate">{creator.title || creator.category?.label}</span>
                        </p>
                      )}
                      {creator.location && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-white/40">
                          <MapPin size={11} className="shrink-0" /> <span className="truncate">{creator.location}</span>
                        </p>
                      )}
                      {(creator.averageRating > 0 || (creator.projectsCompletedCount ?? 0) > 0) && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-yellow-300">
                          {creator.averageRating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star size={12} fill="currentColor" /> {creator.averageRating}
                              <span className="font-normal text-white/40">({creator.reviewCount})</span>
                            </span>
                          )}
                          {(creator.projectsCompletedCount ?? 0) > 0 && (
                            <span className="font-normal text-white/40">
                              {creator.averageRating > 0 && '• '}{creator.projectsCompletedCount} Projects
                            </span>
                          )}
                        </p>
                      )}
                      {creator.skills && creator.skills.length > 0 && (
                        <div className="no-scrollbar mt-2 flex flex-nowrap gap-1.5 overflow-x-auto">
                          {creator.skills.slice(0, 3).map((skill) => (
                            <span key={skill} className="shrink-0 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-white/50">{skill}</span>
                          ))}
                          {creator.skills.length > 3 && (
                            <span className="shrink-0 whitespace-nowrap rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] text-white/40">+{creator.skills.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && !error && creators.length > 0 && page < totalPages && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-navy-800/55 px-6 py-2.5 text-sm font-bold text-white/70 hover:border-white/20 hover:text-white disabled:opacity-50"
            >
              {loadingMore ? <Loader2 size={16} className="animate-spin" /> : 'Load more creators'}
            </button>
          </div>
        )}
      </Container>

      <ProfileLockedModal open={profileLockedOpen} onClose={() => setProfileLockedOpen(false)} kind="creator" />
    </div>
  );
}
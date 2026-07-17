import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Search, Star, BadgeCheck, MapPin, Bookmark, Grid3x3, List, LocateFixed, SlidersHorizontal } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CreatorPosterCard } from '@/components/CreatorPosterCard';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { resolveIcon } from '@/utils/icons';
import { cn } from '@/utils/cn';

const SAVED_KEY = 'fanitt:savedCreators';

function getSavedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

type SortOption = 'relevance' | 'rating' | 'followers';

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
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>(getSavedIds());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      creatorApi
        .list({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          search: search || undefined,
          location: location || undefined,
          page: 1,
        })
        .then((d) => !cancelled && setCreators(d.creators))
        .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
        .finally(() => !cancelled && setLoading(false));
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [categoryFilter, search, location]);

  const toggleSaved = (id: string) => {
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      return next;
    });
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
    let list = [...creators];
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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Home &gt; Creators</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-4xl">
              Discover <span className="brand-gradient-text">Creators</span>
            </h1>
            <p className="mt-1.5 text-sm text-white/60 sm:mt-2 sm:text-base">Find creators that match your style, skills and project needs.</p>
          </div>
          <button
            onClick={handleUseMyLocation}
            disabled={locating}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-xs font-semibold text-white/70 hover:border-orange-400/40 hover:text-white disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
          >
            {locating ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            Use My Location
          </button>
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
            <span className="mb-1 block text-[11px] font-semibold uppercase text-white/40">Location</span>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Anywhere"
              className="w-full rounded-lg border border-white/10 bg-navy-800/60 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase text-white/40">Category</span>
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
            <span className="mb-1 block text-[11px] font-semibold uppercase text-white/40">Skills</span>
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
            <span className="mb-1 block text-[11px] font-semibold uppercase text-white/40">Availability</span>
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
            <span className="mb-1 block text-[11px] font-semibold uppercase text-white/40">Sort By</span>
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
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visibleCreators.map((creator, i) => (
              <motion.div
                key={creator._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 12) * 0.05 }}
              >
                <CreatorPosterCard creator={creator} />
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
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSaved(creator._id);
                    }}
                    aria-label="Save creator"
                    className="absolute right-3.5 top-3.5 z-10 text-white/40 hover:text-orange-400 sm:right-4 sm:top-4"
                  >
                    <Bookmark size={17} fill={savedIds.includes(creator._id) ? 'currentColor' : 'none'} className={savedIds.includes(creator._id) ? 'text-orange-400' : ''} />
                  </button>
                  <Link
                    to={`/creator/${creator.slug}`}
                    className="relative flex items-start gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-3.5 pr-[92px] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-lifted sm:gap-4 sm:p-4 sm:pr-[104px]"
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
                        <p className="truncate text-[15px] font-bold text-white sm:text-base">{creator.user.name}</p>
                        <BadgeCheck size={15} className="shrink-0 fill-sky-500 text-white" strokeWidth={2.5} />
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
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0 whitespace-nowrap rounded-full border border-orange-400/40 px-3 py-1.5 text-[11px] font-bold text-orange-300 sm:right-4 sm:px-4 sm:text-xs">
                      View Profile
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
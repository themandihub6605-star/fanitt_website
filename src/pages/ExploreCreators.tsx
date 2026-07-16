import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { CreatorPosterCard } from '@/components/CreatorPosterCard';
import { creatorApi, type ApiCreator } from '@/services/creatorApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

export default function ExploreCreators() {
  const [creators, setCreators] = useState<ApiCreator[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');
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
  }, [categoryFilter, search]);

  return (
    <div className="pt-28 pb-24">
      <Container>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Explore Creators</h1>
        <p className="mt-2 text-white/60">Discover verified creators across every category on Fanitt.</p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search creators by name or bio..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter('All')}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              categoryFilter === 'All' ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'
            )}
          >
            All categories
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setCategoryFilter(c._id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                categoryFilter === c._id ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20'
              )}
            >
              {c.label}
            </button>
          ))}
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

        {!loading && !error && creators.length === 0 && (
          <p className="mt-16 text-center text-white/50">No creators match these filters yet.</p>
        )}

        {!loading && !error && creators.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {creators.map((creator, i) => (
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
      </Container>
    </div>
  );
}
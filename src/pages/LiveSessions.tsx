import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Video } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { sessionApi, type ApiSession } from '@/services/sessionApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

type TypeFilter = 'all' | 'free' | 'paid';

export default function LiveSessions() {
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const { sessions: fetched } = await sessionApi.list({
          category: categoryFilter !== 'All' ? categoryFilter : undefined,
          free: typeFilter === 'free' ? true : undefined,
          type: typeFilter === 'paid' ? 'paid' : undefined,
          page: 1,
        });
        if (!cancelled) setSessions(fetched);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [categoryFilter, typeFilter]);

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
            <Video size={22} />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Live Sessions</h1>
            <p className="mt-1 text-white/60">Every upcoming session on Fanitt — free and paid.</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'free', 'paid'] as TypeFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors',
                  typeFilter === t
                    ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                    : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
                )}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>

          <span className="h-5 w-px bg-white/10" />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter('All')}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                categoryFilter === 'All'
                  ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                  : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
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
                  categoryFilter === c._id
                    ? 'border-orange-400/60 bg-orange-500/15 text-orange-300'
                    : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading sessions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load sessions — {error}</p>
          </div>
        )}

        {!loading && !error && sessions.length === 0 && (
          <p className="mt-16 text-center text-white/50">No sessions match these filters yet — check back soon.</p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {sessions.map((session, i) => (
              <motion.div
                key={session._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 8) * 0.05 }}
              >
                <ApiSessionCard session={session} className="w-full" />
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
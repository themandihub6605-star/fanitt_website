import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ApiSessionCard } from '@/components/ApiSessionCard';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { sessionApi, type ApiSession } from '@/services/sessionApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { resolveIcon } from '@/utils/icons';

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [sessions, setSessions] = useState<ApiSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const categories = await categoryApi.list();
        const match = categories.find((c) => c.slug === slug);
        if (!match) {
          if (!cancelled) {
            setCategory(null);
            setLoading(false);
          }
          return;
        }
        if (!cancelled) setCategory(match);

        const { sessions: fetchedSessions } = await sessionApi.list({ category: match._id });
        if (!cancelled) setSessions(fetchedSessions);
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
  }, [slug]);

  const Icon = category ? resolveIcon(category.icon) : null;

  return (
    <div className="pt-28 pb-24">
      <Container>
        <Link to="/#categories" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to categories
        </Link>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading sessions...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load this category — {error}</p>
          </div>
        )}

        {!loading && !error && category && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 flex items-center gap-4"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-400">
                {Icon && <Icon size={26} />}
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">{category.label}</h1>
                <p className="mt-1 text-white/60">{sessions.length} session{sessions.length === 1 ? '' : 's'} available</p>
              </div>
            </motion.div>

            {sessions.length > 0 ? (
              <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {sessions.map((session, i) => (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: i * 0.06 }}
                  >
                    <ApiSessionCard session={session} className="w-full" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="mt-10 text-white/60">No sessions in this category yet — check back soon.</p>
            )}
          </>
        )}

        {!loading && !error && !category && <p className="mt-10 text-white/60">Category not found.</p>}
      </Container>
    </div>
  );
}

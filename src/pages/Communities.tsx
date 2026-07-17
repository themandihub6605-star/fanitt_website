import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users2, Plus, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { communityApi, type ApiCommunity } from '@/services/communityApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';

export default function Communities() {
  const [communities, setCommunities] = useState<ApiCommunity[]>([]);
  const [myCommunityIds, setMyCommunityIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);

  const load = () => {
    setLoading(true);
    Promise.all([communityApi.list(), isAuthenticated ? communityApi.getMine() : Promise.resolve([])])
      .then(([listData, mine]) => {
        setCommunities(listData.communities);
        setMyCommunityIds(new Set(mine.map((c) => c._id)));
      })
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [isAuthenticated]);

  const handleJoin = async (id: string) => {
    if (!isAuthenticated) return;
    const result = await communityApi.toggleJoin(id);
    setMyCommunityIds((prev) => {
      const next = new Set(prev);
      if (result.joined) next.add(id);
      else next.delete(id);
      return next;
    });
    setCommunities((prev) =>
      prev.map((c) => (c._id === id ? { ...c, memberCount: c.memberCount + (result.joined ? 1 : -1) } : c))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      await communityApi.create({ name: newName.trim() });
      setNewName('');
      setCreating(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Communities</h1>
            <p className="mt-2 text-white/60">Connect, learn and grow together.</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setCreating((v) => !v)}
              className="flex items-center gap-1.5 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
            >
              <Plus size={16} /> Create community
            </button>
          )}
        </div>

        <AnimatePresence>
          {creating && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleCreate}
              className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-navy-800/60 p-5"
            >
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Community name, e.g. Shutter Stories"
                className="min-w-[240px] flex-1 rounded-lg border border-white/10 bg-navy-800/55 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
              />
              <button type="submit" disabled={submitting} className="flex items-center gap-1.5 rounded-lg bg-teal-500/15 px-4 py-2 text-sm font-bold text-teal-300 hover:bg-teal-500/25">
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Create
              </button>
              <button type="button" onClick={() => setCreating(false)} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/15">
                <X size={14} /> Cancel
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading communities...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && communities.length === 0 && (
          <p className="mt-16 text-center text-white/50">No communities yet — be the first to create one.</p>
        )}

        {!loading && !error && communities.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {communities.map((c, i) => {
              const isMember = myCommunityIds.has(c._id);
              return (
                <motion.div
                  key={c._id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.4, delay: (i % 9) * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-navy-800/60 p-5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                      <Users2 size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-white">{c.name}</p>
                      {c.category && <p className="text-xs text-white/50">{c.category.label}</p>}
                    </div>
                  </div>
                  {c.description && <p className="mt-3 line-clamp-2 text-sm text-white/60">{c.description}</p>}
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-xs text-white/50">{c.memberCount.toLocaleString('en-IN')} members</span>
                    <button
                      onClick={() => handleJoin(c._id)}
                      disabled={!isAuthenticated}
                      className={
                        isMember
                          ? 'rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white/70 hover:bg-white/15'
                          : 'rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-600'
                      }
                    >
                      {isMember ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
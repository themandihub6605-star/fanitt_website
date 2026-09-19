import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, Star, TrendingUp, Users2, Wallet, Loader2, AlertCircle, Briefcase, Radio } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { creatorApi, type CreatorDashboardData } from '@/services/creatorApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

const SOURCE_LABEL: Record<string, string> = {
  Session: 'Live sessions',
  Campaign: 'Brand campaigns',
};

export default function CreatorAnalytics() {
  const [data, setData] = useState<CreatorDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    creatorApi
      .getMyDashboard()
      .then(setData)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading analytics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          <AlertCircle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-white/60">{error || 'Could not load analytics.'}</p>
        </Container>
      </div>
    );
  }

  const { stats, earningsBreakdown } = data;
  const maxBreakdown = Math.max(...earningsBreakdown.map((b) => b.total), 1);

  return (
    <div className="pt-24 pb-24 sm:pt-28">
      <Container className="max-w-2xl">
        <Link to="/dashboard/creator" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="mt-4 text-2xl font-bold text-white">Analytics</h1>
          <p className="mt-1 text-sm text-white/50">How your profile and earnings are performing.</p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-navy-800/70 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Wallet size={16} />
              </span>
              <p className="mt-3 text-xl font-bold text-white">{formatRupees(stats.totalEarnings)}</p>
              <p className="text-[11px] text-white/40">Total earnings</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-800/70 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500/15 text-orange-400">
                <TrendingUp size={16} />
              </span>
              <p className="mt-3 text-xl font-bold text-white">{formatRupees(stats.thisMonthEarnings)}</p>
              <p className="text-[11px] text-white/40">This month</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-800/70 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/15 text-sky-300">
                <Eye size={16} />
              </span>
              <p className="mt-3 text-xl font-bold text-white">{stats.profileViews.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-white/40">Profile views</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-navy-800/70 p-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-500/15 text-pink-300">
                <Users2 size={16} />
              </span>
              <p className="mt-3 text-xl font-bold text-white">{stats.followerCount.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-white/40">Followers</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-navy-800/70 p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                <Star size={16} />
              </span>
              <div>
                <p className="text-lg font-bold text-white">
                  {stats.averageRating ? stats.averageRating.toFixed(1) : '—'}
                  <span className="ml-1 text-sm font-normal text-white/50">/ 5</span>
                </p>
                <p className="text-[11px] text-white/40">{stats.reviewCount} review{stats.reviewCount === 1 ? '' : 's'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-navy-800/70 p-5">
            <p className="mb-4 text-sm font-bold text-white">Earnings breakdown</p>
            {earningsBreakdown.length === 0 ? (
              <p className="text-sm text-white/40">No earnings yet.</p>
            ) : (
              <div className="space-y-3">
                {earningsBreakdown.map((b) => (
                  <div key={b._id}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-semibold text-white/70">
                        {b._id === 'Session' ? <Radio size={12} /> : <Briefcase size={12} />}
                        {SOURCE_LABEL[b._id] || b._id || 'Other'}
                      </span>
                      <span className="font-bold text-white">{formatRupees(b.total)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-orange-500"
                        style={{ width: `${Math.max((b.total / maxBreakdown) * 100, 4)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
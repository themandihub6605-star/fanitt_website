import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, Briefcase, Clock } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { StatusBadge } from '@/components/StatusBadge';
import { campaignApi, type ApiProposal, type ProposalCounts } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { cn } from '@/utils/cn';

type TabKey = 'all' | 'pending' | 'accepted' | 'rejected';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Sent' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Declined' },
];

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function MyProposals() {
  const [proposals, setProposals] = useState<ApiProposal[]>([]);
  const [counts, setCounts] = useState<ProposalCounts | null>(null);
  const [tab, setTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    campaignApi
      .getMyProposals(tab === 'all' ? undefined : tab)
      .then((d) => {
        if (cancelled) return;
        setProposals(d.proposals);
        setCounts(d.counts);
      })
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [tab]);

  return (
    <div className="pt-28 pb-24">
      <Container>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">My Proposals</h1>
        <p className="mt-1 text-sm text-white/60">Track, manage and follow up on every opportunity you've applied to.</p>

        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                tab === t.key ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
              )}
            >
              {t.label}
              {counts && <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px]">{counts[t.key]}</span>}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading proposals...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && proposals.length === 0 && (
          <p className="mt-16 text-center text-white/50">No proposals here yet.</p>
        )}

        {!loading && !error && proposals.length > 0 && (
          <div className="mt-8 space-y-4">
            {proposals.map((p, i) => (
              <motion.div
                key={p._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.05 }}
              >
                <Link
                  to={`/campaigns/${p.campaign._id}`}
                  className="block rounded-2xl border border-white/10 bg-navy-800/60 p-5 transition-colors hover:border-white/20"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.campaign.brand.logoUrl || `https://i.pravatar.cc/80?u=${p.campaign.brand._id}`}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{p.campaign.title}</p>
                        <p className="text-xs text-white/50">{p.campaign.brand.companyName}</p>
                      </div>
                    </div>
                    <StatusBadge status={p.status === 'pending' ? 'pending' : p.status} />
                  </div>

                  {p.pitch && <p className="mt-3 line-clamp-2 text-sm text-white/60">{p.pitch}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-white/10 pt-3 text-xs text-white/50">
                    <span className="flex items-center gap-1.5">
                      <Briefcase size={12} />
                      {p.quotedAmount ? `Quoted ${formatRupees(p.quotedAmount)}` : `Budget ${formatRupees(p.campaign.budget)}`}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> Sent {new Date(p.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>

                  {p.status === 'rejected' && p.feedback && (
                    <p className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-300">{p.feedback}</p>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
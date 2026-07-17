import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Briefcase, Users2, MapPin, Clock, Plus, Loader2, AlertCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { campaignApi, type ApiCampaign } from '@/services/campaignApi';
import { categoryApi, type ApiCategory } from '@/services/categoryApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<ApiCampaign[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [filter, setFilter] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isBrand = useAppSelector((s) => s.auth.user?.role === 'brand');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [campaignData, categoryData] = await Promise.all([
          campaignApi.list(filter !== 'All' ? { category: filter } : undefined),
          categories.length === 0 ? categoryApi.list() : Promise.resolve(categories),
        ]);
        if (!cancelled) {
          setCampaigns(campaignData.campaigns);
          if (categories.length === 0) setCategories(categoryData);
        }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  return (
    <div className="pt-28 pb-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="rounded-full border border-orange-500/30 bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-300">
              Brand Requirements
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">Open campaigns</h1>
            <p className="mt-2 max-w-xl text-white/60">
              Brands post what they need — browse and apply. Every budget is held in escrow until your work is approved.
            </p>
          </div>
          {isBrand && (
            <Link to="/campaigns/new">
              <Button>
                <Plus size={16} /> Post a requirement
              </Button>
            </Link>
          )}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('All')}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
              filter === 'All' ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
            )}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              onClick={() => setFilter(c._id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors',
                filter === c._id ? 'border-orange-400/60 bg-orange-500/15 text-orange-300' : 'border-white/10 bg-navy-800/55 text-white/60 hover:border-white/20'
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-16 flex flex-col items-center gap-3 text-white/50">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading campaigns...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mt-16 flex flex-col items-center gap-3 text-center text-white/60">
            <AlertCircle size={28} className="text-red-400" />
            <p className="text-sm">Couldn't load campaigns — {error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {campaigns.map((campaign, i) => (
              <motion.div
                key={campaign._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.07 }}
              >
                <Link
                  to={`/campaigns/${campaign._id}`}
                  className="block h-full rounded-2xl border border-white/10 bg-navy-800/60 p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-lifted"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={campaign.brand.logoUrl || `https://i.pravatar.cc/80?u=${campaign.brand._id}`}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-bold text-white">{campaign.brand.companyName}</p>
                      <p className="text-xs text-white/50">{campaign.applicantCount} applicants</p>
                    </div>
                    <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white/70">
                      {campaign.category?.label}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-white">{campaign.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/60">{campaign.description}</p>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs">
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Briefcase size={13} className="shrink-0 text-orange-400" /> ₹{(campaign.budget / 100).toLocaleString('en-IN')}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <Clock size={13} className="shrink-0 text-teal-400" /> {campaign.durationLabel || '—'}
                    </div>
                    <div className="flex items-center gap-1.5 text-white/50">
                      <MapPin size={13} className="shrink-0 text-yellow-400" /> {campaign.location}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className="mt-16 flex flex-col items-center text-center text-white/50">
            <Users2 size={32} className="mb-3" />
            <p>No open campaigns in this category yet.</p>
          </div>
        )}
      </Container>
    </div>
  );
}

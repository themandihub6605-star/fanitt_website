import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, Check, X, Briefcase } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { campaignApi, type ApiApplication, type ApiCampaign } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function CampaignApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    Promise.all([campaignApi.getById(id), campaignApi.getApplications(id)])
      .then(([campaignData, apps]) => {
        if (cancelled) return;
        setCampaign(campaignData);
        setApplications(apps);
      })
      .catch((err) => !cancelled && setError(getApiErrorMessage(err)))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDecision = async (appId: string, decision: 'accepted' | 'rejected') => {
    if (!id) return;
    setDecidingId(appId);
    try {
      await campaignApi.decideApplication(id, appId, decision);
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status: decision } : a)));
      if (decision === 'accepted') {
        const updated = await campaignApi.getById(id);
        setCampaign(updated);
      }
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDecidingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading applicants...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          <AlertCircle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-white/60">{error || 'Campaign not found.'}</p>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24">
      <Container>
        <Link to={`/campaigns/${id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaign
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Applicants for "{campaign.title}"</h1>
        <p className="mt-1 text-sm text-white/60">
          {applications.length} proposal{applications.length === 1 ? '' : 's'} received
          {campaign.assignedCreator && ' — you have already accepted a creator for this campaign.'}
        </p>

        {error && (
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {applications.length === 0 ? (
          <p className="mt-16 text-center text-white/50">No proposals yet — check back soon.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {applications.map((app, i) => {
              const isAssigned = campaign.assignedCreator?._id === app.creator._id;
              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={app.creator.user.avatarUrl || `https://i.pravatar.cc/80?u=${app.creator._id}`}
                        alt=""
                        className="h-11 w-11 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-white">{app.creator.user.name}</p>
                        {app.quotedAmount ? (
                          <p className="flex items-center gap-1 text-xs text-teal-300">
                            <Briefcase size={11} /> Quoted {formatRupees(app.quotedAmount)}
                          </p>
                        ) : (
                          <p className="text-xs text-white/50">Accepts posted budget</p>
                        )}
                      </div>
                    </div>

                    {app.status === 'pending' && !campaign.assignedCreator && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(app._id, 'accepted')}
                          disabled={decidingId === app._id}
                          className="flex items-center gap-1.5 rounded-lg bg-teal-500/15 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/25 disabled:opacity-50"
                        >
                          <Check size={13} /> Accept
                        </button>
                        <button
                          onClick={() => handleDecision(app._id, 'rejected')}
                          disabled={decidingId === app._id}
                          className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                        >
                          <X size={13} /> Decline
                        </button>
                      </div>
                    )}

                    {app.status !== 'pending' && (
                      <span
                        className={
                          app.status === 'accepted'
                            ? 'rounded-full bg-teal-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-teal-300'
                            : 'rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-bold uppercase text-red-300'
                        }
                      >
                        {app.status}
                      </span>
                    )}
                  </div>

                  {app.pitch && <p className="mt-3 text-sm text-white/70">{app.pitch}</p>}

                  {isAssigned && (
                    <button
                      onClick={() => navigate(`/campaigns/${id}`)}
                      className="mt-4 text-xs font-semibold text-orange-400 hover:underline"
                    >
                      Go fund escrow for this creator →
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
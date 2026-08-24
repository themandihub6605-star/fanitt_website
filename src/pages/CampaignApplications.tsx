import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, AlertCircle, Check, X, Briefcase, Timer, Play, Instagram, Video, MessageCircle } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { campaignApi, type ApiApplication, type ApiCampaign } from '@/services/campaignApi';
import { chatApi } from '@/services/chatApi';
import { getApiErrorMessage } from '@/services/apiClient';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function isInstagramLink(url: string) {
  return /instagram\.com/i.test(url);
}

function RejectModal({
  open,
  onClose,
  onConfirm,
  submitting,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState('');

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-t-3xl border border-white/10 bg-navy-900 p-6 sm:max-w-sm sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Decline proposal</h2>
              <button onClick={onClose} className="text-white/50 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="mt-1 text-sm text-white/50">
              This reason is shown to the creator so they understand why, and is visible to Fanitt admin for review.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-semibold text-white/70">Reason (required)</span>
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Follower count doesn't match our requirement, or timeline doesn't work for our launch date..."
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-red-400"
              />
            </label>
            <Button
              className="mt-4 w-full justify-center !bg-red-500 hover:!bg-red-600"
              disabled={!reason.trim() || submitting}
              onClick={() => onConfirm(reason.trim())}
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm decline'}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function CampaignApplications() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [applications, setApplications] = useState<ApiApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | null>(null);
  const [messagingId, setMessagingId] = useState<string | null>(null);

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

  const handleAccept = async (appId: string) => {
    if (!id) return;
    setDecidingId(appId);
    try {
      await campaignApi.decideApplication(id, appId, 'accepted');
      setApplications((prev) => prev.map((a) => (a._id === appId ? { ...a, status: 'accepted' } : a)));
      const updated = await campaignApi.getById(id);
      setCampaign(updated);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDecidingId(null);
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!id || !rejectTargetId) return;
    setDecidingId(rejectTargetId);
    try {
      await campaignApi.decideApplication(id, rejectTargetId, 'rejected', { rejectionReason: reason });
      setApplications((prev) =>
        prev.map((a) => (a._id === rejectTargetId ? { ...a, status: 'rejected', rejectionReason: reason } : a))
      );
      setRejectTargetId(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDecidingId(null);
    }
  };

  // Opens (or starts) a DM with the applicant and drops an auto context
  // message so neither side has to explain which campaign this is about.
  const handleMessage = async (app: ApiApplication) => {
    if (!campaign) return;
    setMessagingId(app._id);
    try {
      const conversation = await chatApi.startConversation(app.creator.user._id);
      // Only seed the context line the first time this thread has no messages yet.
      const existing = await chatApi.getMessages(conversation._id);
      if (existing.length === 0) {
        await chatApi.sendMessage(conversation._id, `Hi! Regarding your proposal for "${campaign.title}".`);
      }
      navigate(`/messages?with=${app.creator.user._id}`);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setMessagingId(null);
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
              const hasLinks = app.portfolioLinks && app.portfolioLinks.length > 0;
              const rejectionReason = (app as ApiApplication & { rejectionReason?: string }).rejectionReason;
              return (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-navy-800/60 p-5"
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

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleMessage(app)}
                        disabled={messagingId === app._id}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-white/80 hover:border-orange-400/50 hover:text-orange-300 disabled:opacity-50"
                      >
                        {messagingId === app._id ? <Loader2 size={13} className="animate-spin" /> : <MessageCircle size={13} />}
                        Message
                      </button>

                      {app.status === 'pending' && !campaign.assignedCreator && (
                        <>
                          <button
                            onClick={() => handleAccept(app._id)}
                            disabled={decidingId === app._id}
                            className="flex items-center gap-1.5 rounded-lg bg-teal-500/15 px-3 py-1.5 text-xs font-bold text-teal-300 hover:bg-teal-500/25 disabled:opacity-50"
                          >
                            <Check size={13} /> Accept
                          </button>
                          <button
                            onClick={() => setRejectTargetId(app._id)}
                            disabled={decidingId === app._id}
                            className="flex items-center gap-1.5 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/25 disabled:opacity-50"
                          >
                            <X size={13} /> Decline
                          </button>
                        </>
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
                  </div>

                  {app.pitch && <p className="mt-3 text-sm text-white/70">{app.pitch}</p>}

                  {app.deliveryTimeline && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-white/50">
                      <Timer size={12} /> Delivery: {app.deliveryTimeline}
                    </p>
                  )}

                  {hasLinks && (
                    <div className="mt-4">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/40">Sample Videos</p>
                      <div className="flex flex-wrap gap-3">
                        {app.portfolioLinks!.map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-center gap-3 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-navy-800/80 to-navy-900/80 py-2.5 pl-2.5 pr-4 transition-colors hover:border-orange-400/50"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white shadow-glow transition-transform group-hover:scale-105">
                              <Play size={14} fill="currentColor" className="ml-0.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white">Sample Video {app.portfolioLinks!.length > 1 ? idx + 1 : ''}</p>
                              <p className="flex items-center gap-1 text-[10px] text-white/50">
                                {isInstagramLink(link) ? (
                                  <>
                                    <Instagram size={10} /> Instagram Reel
                                  </>
                                ) : (
                                  <>
                                    <Video size={10} /> View video
                                  </>
                                )}
                              </p>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {app.status === 'rejected' && rejectionReason && (
                    <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-red-300">Reason for decline</p>
                      <p className="mt-1 text-sm text-white/70">{rejectionReason}</p>
                    </div>
                  )}

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

      <RejectModal
        open={rejectTargetId !== null}
        onClose={() => setRejectTargetId(null)}
        onConfirm={handleRejectConfirm}
        submitting={decidingId === rejectTargetId}
      />
    </div>
  );
}
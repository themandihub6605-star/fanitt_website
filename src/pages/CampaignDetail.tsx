import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Briefcase,
  Clock,
  MapPin,
  Users2,
  ShieldCheck,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { campaignApi, type ApiCampaign } from '@/services/campaignApi';
import { getApiErrorMessage } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [quotedAmount, setQuotedAmount] = useState('');
  const [pitch, setPitch] = useState('');

  const [funding, setFunding] = useState(false);

  const [workUrl, setWorkUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [approving, setApproving] = useState(false);

  const load = () => {
    if (!id) return;
    setLoading(true);
    campaignApi
      .getById(id)
      .then(setCampaign)
      .catch((err) => setError(getApiErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const isBrandOwner = campaign && user?.role === 'brand' && campaign.brand.user._id === user._id;
  const isAssignedCreator = campaign?.assignedCreator?.user._id === user?._id;
  const canApply = user?.role === 'creator' && campaign?.status === 'open';

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/campaigns/${id}` } });
      return;
    }
    if (!id) return;
    setApplying(true);
    setError('');
    try {
      await campaignApi.apply(id, {
        pitch: pitch || undefined,
        quotedAmount: quotedAmount ? Math.round(parseFloat(quotedAmount) * 100) : undefined,
      });
      setApplied(true);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setApplying(false);
    }
  };

  const handleFundEscrow = async () => {
    if (!id || !campaign) return;
    setFunding(true);
    setError('');
    try {
      const { order } = await campaignApi.initiateEscrowFunding(id);
      const paymentResponse = await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        name: 'Fanitt',
        description: `Escrow for "${campaign.title}"`,
        prefillName: user?.name,
        prefillEmail: user?.email,
      });
      await campaignApi.verifyEscrowPayment(id, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setFunding(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!id || !workUrl.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await campaignApi.submitWork(id, workUrl.trim());
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!id) return;
    setApproving(true);
    setError('');
    try {
      await campaignApi.approveWork(id);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading campaign...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="pt-32 pb-24 text-center">
        <Container>
          <AlertCircle size={28} className="mx-auto mb-3 text-red-400" />
          <p className="text-white/60">{error || 'Campaign not found.'}</p>
          <Link to="/campaigns" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-400">
            <ArrowLeft size={15} /> Back to campaigns
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-24">
      <Container className="max-w-3xl">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaigns
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mt-6 rounded-[2rem] border border-white/10 bg-navy-800/70 p-8 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3">
            <img
              src={campaign.brand.logoUrl || `https://i.pravatar.cc/80?u=${campaign.brand._id}`}
              alt=""
              className="h-12 w-12 rounded-full object-cover"
            />
            <div>
              <p className="font-bold text-white">{campaign.brand.companyName}</p>
              <p className="text-xs text-white/50">{campaign.applicantCount} applicants</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <StatusBadge status={campaign.status} />
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/70">
                {campaign.category?.label}
              </span>
            </div>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-white sm:text-3xl">{campaign.title}</h1>
          <p className="mt-3 leading-relaxed text-white/70">{campaign.description}</p>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-navy-800/45 p-4">
              <Briefcase size={16} className="text-orange-400" />
              <p className="mt-2 text-sm font-bold text-white">{formatRupees(campaign.budget)}</p>
              <p className="text-xs text-white/50">Budget</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-navy-800/45 p-4">
              <Clock size={16} className="text-teal-400" />
              <p className="mt-2 text-sm font-bold text-white">{campaign.durationLabel || '—'}</p>
              <p className="text-xs text-white/50">Duration</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-navy-800/45 p-4">
              <MapPin size={16} className="text-yellow-400" />
              <p className="mt-2 text-sm font-bold text-white">{campaign.location}</p>
              <p className="text-xs text-white/50">Location</p>
            </div>
          </div>

          {campaign.creatorRequirement && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-navy-800/45 p-4">
              <Users2 size={16} className="mt-0.5 shrink-0 text-white/50" />
              <div>
                <p className="text-sm font-bold text-white">Who they're looking for</p>
                <p className="mt-1 text-sm text-white/60">{campaign.creatorRequirement}</p>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-teal-500/20 bg-teal-500/10 p-4">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-teal-400" />
            <p className="text-sm text-teal-200">
              This budget is held in Fanitt escrow the moment a creator is accepted and funded, and released the moment
              their work is approved.
            </p>
          </div>

          {error && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={16} className="shrink-0" /> {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {!applied && canApply && (
              <motion.div key="apply-form" initial={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-7 space-y-3 border-t border-white/10 pt-6">
                <h3 className="text-sm font-bold text-white">Apply to this opportunity</h3>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Your quote (₹, optional — leave blank to accept posted budget)</span>
                  <input
                    type="number"
                    min="1"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder={`e.g. ${campaign.budget / 100}`}
                    className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Pitch (optional)</span>
                  <textarea
                    rows={3}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Why you're a great fit for this..."
                    className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>
                <Button className="w-full justify-center" disabled={applying} onClick={handleApply}>
                  {applying ? <Loader2 size={18} className="animate-spin" /> : 'Send proposal'}
                </Button>
              </motion.div>
            )}

            {applied && (
              <motion.div
                key="applied"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300"
              >
                <Check size={16} /> Proposal sent — track it under "My Proposals".
              </motion.div>
            )}
          </AnimatePresence>

          {isBrandOwner && (
            <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
              {campaign.status === 'open' && (
                <Link to={`/campaigns/${id}/applications`}>
                  <Button className="w-full justify-center" variant="outline">
                    View {campaign.applicantCount} applicant{campaign.applicantCount === 1 ? '' : 's'}
                  </Button>
                </Link>
              )}

              {campaign.status === 'open' && campaign.assignedCreator && (
                <Button className="w-full justify-center" disabled={funding} onClick={handleFundEscrow}>
                  {funding ? <Loader2 size={18} className="animate-spin" /> : `Fund escrow — ${formatRupees(campaign.budget)}`}
                </Button>
              )}

              {campaign.status === 'submitted' && (
                <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4">
                  <p className="text-sm font-bold text-yellow-200">Work submitted for review</p>
                  {campaign.submittedWorkUrl && (
                    <a
                      href={campaign.submittedWorkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-orange-300 hover:underline"
                    >
                      View submission <ExternalLink size={13} />
                    </a>
                  )}
                  <Button className="mt-4 w-full justify-center" disabled={approving} onClick={handleApprove}>
                    {approving ? <Loader2 size={18} className="animate-spin" /> : 'Approve & release payment'}
                  </Button>
                </div>
              )}

              {campaign.status === 'completed' && (
                <div className="flex items-center justify-center gap-2 rounded-xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
                  <Check size={16} /> Completed — payment released to the creator.
                </div>
              )}
            </div>
          )}

          {isAssignedCreator && campaign.status === 'in_progress' && (
            <div className="mt-7 space-y-3 border-t border-white/10 pt-6">
              <h3 className="text-sm font-bold text-white">Submit your work</h3>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-white/70">Link to your deliverable (Drive, Dropbox, etc.)</span>
                <input
                  type="text"
                  value={workUrl}
                  onChange={(e) => setWorkUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full rounded-xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                />
              </label>
              <Button className="w-full justify-center" disabled={submitting || !workUrl.trim()} onClick={handleSubmitWork}>
                {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit work'}
              </Button>
            </div>
          )}

          {isAssignedCreator && campaign.status === 'submitted' && (
            <div className="mt-7 rounded-xl bg-yellow-400/10 py-3.5 text-center text-sm font-bold text-yellow-200">
              Waiting for the brand to review your submission.
            </div>
          )}

          {isAssignedCreator && campaign.status === 'completed' && (
            <div className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
              <Check size={16} /> Paid — this campaign is complete.
            </div>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
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
  Instagram,
  ImagePlus,
  Calendar,
  Maximize2,
  X,
  ChevronDown,
  Link2,
  Timer,
  Building2,
  Plus,
  Sparkles,
  Wallet,
  Lock,
  Paperclip,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  Gift,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { campaignApi, type ApiCampaign } from '@/services/campaignApi';
import { milestoneApi, type ApiMilestone } from '@/services/milestoneApi';
import { ReviewModal } from '@/components/ReviewModal';
import { subscriptionApi, type ApiUserSubscription } from '@/services/subscriptionApi';
import { getApiErrorMessage, getApiErrorCode } from '@/services/apiClient';
import { openRazorpayCheckout } from '@/utils/razorpay';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/utils/cn';

function formatRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm)$/i.test(url);
}

function ExpandableImage({
  src,
  alt = '',
  className,
  onExpand,
  isVideo = false,
  roundedClassName = 'rounded-xl',
}: {
  src: string;
  alt?: string;
  className: string;
  onExpand: (url: string) => void;
  isVideo?: boolean;
  roundedClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onExpand(src)}
      className={cn('group relative block w-full overflow-hidden', roundedClassName)}
    >
      {isVideo ? (
        <video src={src} className={className} muted />
      ) : (
        <img src={src} alt={alt} className={className} />
      )}
      <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white opacity-80 backdrop-blur-sm transition-opacity group-hover:opacity-100">
        <Maximize2 size={13} />
      </span>
    </button>
  );
}

// Adaptive sample-media layout for the sidebar: 1 item gets the full
// tile, 2 split side-by-side, 3 becomes one big tile + two below —
// fills the leftover sidebar space instead of a cramped thumbnail row.
function SampleMediaGrid({ media, onExpand }: { media: string[]; onExpand: (url: string) => void }) {
  if (media.length === 1) {
    return (
      <ExpandableImage
        src={media[0]}
        className="h-64 w-full object-cover"
        onExpand={onExpand}
        isVideo={isVideoUrl(media[0])}
        roundedClassName="rounded-2xl"
      />
    );
  }
  if (media.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {media.map((url, i) => (
          <ExpandableImage
            key={i}
            src={url}
            className="h-40 w-full object-cover"
            onExpand={onExpand}
            isVideo={isVideoUrl(url)}
            roundedClassName="rounded-2xl"
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      <ExpandableImage
        src={media[0]}
        className="col-span-2 h-40 w-full object-cover"
        onExpand={onExpand}
        isVideo={isVideoUrl(media[0])}
        roundedClassName="rounded-2xl"
      />
      {media.slice(1, 3).map((url, i) => (
        <ExpandableImage
          key={i}
          src={url}
          className="h-28 w-full object-cover"
          onExpand={onExpand}
          isVideo={isVideoUrl(url)}
          roundedClassName="rounded-2xl"
        />
      ))}
    </div>
  );
}

// Small pill used in the "who brands are looking for" chip row.
function RequirementChip({ children, accent = false }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <span
      className={cn(
        'rounded-full border px-3.5 py-2 text-xs font-semibold',
        accent ? 'border-orange-400/25 bg-orange-500/10 text-orange-300' : 'border-white/10 bg-white/5 text-white/70'
      )}
    >
      {children}
    </span>
  );
}

// Compact "N Reel / N Story" pill used in the deliverables strip.
function DeliverableChip({ count, label }: { count: number; label: string }) {
  if (!count) return null;
  return (
    <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/70">
      <span className="text-sm font-bold text-white">{count}</span> {label}
      {count > 1 ? 's' : ''}
    </span>
  );
}

// Small section heading used throughout the page: an icon chip + label,
// no uppercase eyebrow, no left accent bar — the icon itself signals
// what kind of information follows.
function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/50">{icon}</span>
      <h2 className="text-base font-bold text-white">{children}</h2>
    </div>
  );
}

// One row in the sidebar's quick-facts card: label left, value right,
// full width — replaces the old stat rail that left a blank gap on the
// right on wide screens.
function QuickFactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className="flex items-center gap-2 text-xs font-semibold text-white/50">
        <span className="text-white/40">{icon}</span>
        {label}
      </span>
      <span className="text-right text-sm font-bold text-white">{value}</span>
    </div>
  );
}

const DESCRIPTION_TRUNCATE_LENGTH = 220;

function ApplyModal({
  open,
  onClose,
  campaign,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  campaign: ApiCampaign;
  onSubmitted: () => void;
}) {
  const [quotedAmount, setQuotedAmount] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>(['']);
  const [deliveryTimeline, setDeliveryTimeline] = useState('');
  const [pitch, setPitch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [exclusiveLocked, setExclusiveLocked] = useState(false);

  const [mySubscription, setMySubscription] = useState<ApiUserSubscription | null>(null);
  const [subLoading, setSubLoading] = useState(true);

  const MAX_LINKS = 3;

  // Load the creator's current plan + usage whenever the modal opens, so
  // "X of Y proposals left" reflects the real count instead of going
  // stale between opens.
  useEffect(() => {
    if (!open) return;
    setSubLoading(true);
    subscriptionApi
      .getMySubscription()
      .then(setMySubscription)
      .catch(() => setMySubscription(null))
      .finally(() => setSubLoading(false));
  }, [open]);

  const updateLink = (index: number, value: string) => {
    setPortfolioLinks((links) => links.map((l, i) => (i === index ? value : l)));
  };

  const addLinkField = () => {
    if (portfolioLinks.length < MAX_LINKS) setPortfolioLinks((links) => [...links, '']);
  };

  const removeLinkField = (index: number) => {
    setPortfolioLinks((links) => links.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    setQuotaExceeded(false);
    setExclusiveLocked(false);
    try {
      const parsedQuote = quotedAmount.trim() ? Math.round(parseFloat(quotedAmount) * 100) : NaN;
      await campaignApi.apply(campaign._id, {
        pitch: pitch || undefined,
        quotedAmount: Number.isFinite(parsedQuote) ? parsedQuote : undefined,
        portfolioLinks: portfolioLinks.map((l) => l.trim()).filter(Boolean),
        deliveryTimeline: deliveryTimeline.trim() || undefined,
      });
      onSubmitted();
    } catch (err) {
      const errorCode = getApiErrorCode(err);
      if (errorCode === 'PROPOSAL_QUOTA_EXCEEDED') {
        setQuotaExceeded(true);
      } else if (errorCode === 'EXCLUSIVE_CAMPAIGN_LOCKED') {
        setExclusiveLocked(true);
      } else {
        setError(getApiErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const limit = mySubscription?.plan.proposalLimit ?? null;
  const used = mySubscription?.proposalsUsedThisCycle ?? 0;
  const remaining = limit == null ? null : Math.max(0, limit - used);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-navy-900 p-6 sm:max-w-md sm:rounded-3xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Apply to this opportunity</h2>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/5 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 truncate text-sm text-white/50">{campaign.title}</p>

            {!subLoading && limit != null && !quotaExceeded && (
              <p className="mt-2 text-xs font-semibold text-white/50">
                {remaining} of {limit} proposal{limit === 1 ? '' : 's'} left this cycle
              </p>
            )}

            {quotaExceeded && (
              <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-orange-300">
                  <Sparkles size={14} /> You're out of proposals for this cycle
                </p>
                <p className="mt-1.5 text-sm text-white/60">
                  Upgrade your plan to send more proposals — or wait for your usage to reset next cycle.
                </p>
                <Link
                  to="/pricing"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  View plans
                </Link>
              </div>
            )}

            {exclusiveLocked && (
              <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4">
                <p className="flex items-center gap-1.5 text-sm font-bold text-orange-300">
                  <Sparkles size={14} /> This is an exclusive campaign for Pro creators
                </p>
                <p className="mt-1.5 text-sm text-white/60">
                  Upgrade to Pro to apply to exclusive campaigns from Pro and Elite brands.
                </p>
                <Link
                  to="/pricing"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-full bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}

            {!quotaExceeded && !exclusiveLocked && (
              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">
                    Your quote (₹, optional — leave blank to accept posted budget)
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={quotedAmount}
                    onChange={(e) => setQuotedAmount(e.target.value)}
                    placeholder={campaign.budget ? `e.g. ${campaign.budget / 100}` : undefined}
                    className="w-full rounded-2xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <div>
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Link2 size={12} /> Portfolio link(s) (optional, up to {MAX_LINKS})
                  </span>
                  <div className="space-y-2">
                    {portfolioLinks.map((link, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={link}
                          onChange={(e) => updateLink(i, e.target.value)}
                          placeholder="https://instagram.com/reel/..."
                          className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                        />
                        {portfolioLinks.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLinkField(i)}
                            className="shrink-0 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 text-white/40 hover:border-red-400/50 hover:text-red-400"
                          >
                            <X size={15} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  {portfolioLinks.length < MAX_LINKS && (
                    <button
                      type="button"
                      onClick={addLinkField}
                      className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-400 hover:underline"
                    >
                      <Plus size={13} /> Add another link
                    </button>
                  )}
                </div>

                <label className="block">
                  <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Timer size={12} /> Delivery timeline (optional)
                  </span>
                  <input
                    type="text"
                    value={deliveryTimeline}
                    onChange={(e) => setDeliveryTimeline(e.target.value)}
                    placeholder="e.g. 3 days"
                    className="w-full rounded-2xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-white/70">Pitch (optional)</span>
                  <textarea
                    rows={3}
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Why you're a great fit for this..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-navy-800/55 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-orange-400"
                  />
                </label>

                <Button className="w-full justify-center" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : 'Send proposal'}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const MILESTONE_STATUS_LABEL: Record<string, string> = {
  pending: 'Awaiting funding',
  funded: 'Held in Escrow',
  submitted: 'Submitted — awaiting review',
  changes_requested: 'Changes requested',
  disputed: 'Disputed — under review',
  released: 'Released',
};

const MILESTONE_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-white/10 text-white/60',
  funded: 'bg-sky-500/15 text-sky-300',
  submitted: 'bg-yellow-400/15 text-yellow-300',
  changes_requested: 'bg-orange-400/15 text-orange-300',
  disputed: 'bg-red-500/15 text-red-300',
  released: 'bg-emerald-500/15 text-emerald-300',
};

// Creator's work-submission form — used both for the first submission
// (FUNDED -> SUBMITTED) and resubmission after a change request
// (CHANGES_REQUESTED -> SUBMITTED), same shape either way.
function SubmissionForm({
  submitLabel,
  onSubmit,
  submitting,
}: {
  submitLabel: string;
  onSubmit: (payload: { description: string; links: string[]; files: File[] }) => void;
  submitting: boolean;
}) {
  const [description, setDescription] = useState('');
  const [links, setLinks] = useState<string[]>(['']);
  const [files, setFiles] = useState<File[]>([]);

  const updateLink = (i: number, value: string) => setLinks((prev) => prev.map((l, idx) => (idx === i ? value : l)));
  const addLink = () => setLinks((prev) => [...prev, '']);
  const removeLink = (i: number) => setLinks((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div className="mt-3 space-y-2.5">
      <textarea
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Describe what you're submitting..."
        className="w-full resize-none rounded-2xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-400"
      />
      <div className="space-y-1.5">
        {links.map((link, i) => (
          <div key={i} className="flex gap-1.5">
            <input
              type="text"
              value={link}
              onChange={(e) => updateLink(i, e.target.value)}
              placeholder="Link (Drive, Figma, etc.)"
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-400"
            />
            {links.length > 1 && (
              <button
                type="button"
                onClick={() => removeLink(i)}
                className="shrink-0 flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 text-white/40 hover:border-red-400/50 hover:text-red-400"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addLink} className="flex items-center gap-1 text-[11px] font-semibold text-orange-400 hover:underline">
          <Plus size={11} /> Add another link
        </button>
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-white/50">Attachments (optional)</span>
        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full rounded-2xl border border-white/10 bg-navy-800/70 px-3 py-1.5 text-[11px] text-white/70 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-2.5 file:py-1 file:text-[10px] file:font-bold file:text-orange-300"
        />
      </label>
      <Button
        className="w-full justify-center"
        disabled={submitting || !description.trim()}
        onClick={() => onSubmit({ description: description.trim(), links, files })}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : submitLabel}
      </Button>
    </div>
  );
}

// One milestone's card — renders whichever UI applies given the viewer's
// role, the milestone's current status, and whether it's locked (an
// earlier milestone hasn't been released yet — see the sequential-unlock
// logic in CampaignDetail below, which computes `locked` per card).
// `index` numbers the card to match the read-only "How you'll get paid"
// timeline above it, so the two stay visually linked.
function MilestoneCard({
  milestone,
  index,
  locked,
  isBrandOwner,
  isAssignedCreator,
  brandName,
  onChanged,
}: {
  milestone: ApiMilestone;
  index: number;
  locked: boolean;
  isBrandOwner: boolean;
  isAssignedCreator: boolean;
  brandName: string;
  onChanged: () => void;
}) {
  const [funding, setFunding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [disputing, setDisputing] = useState(false);
  const [error, setError] = useState('');

  // Brand's review panel: which of the 3 decisions they're mid-filling-out, if any.
  const [activeDecision, setActiveDecision] = useState<'none' | 'changes' | 'dispute'>('none');
  const [changeDescription, setChangeDescription] = useState('');
  const [changeLinks, setChangeLinks] = useState<string[]>(['']);
  const [changeFiles, setChangeFiles] = useState<File[]>([]);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeFiles, setDisputeFiles] = useState<File[]>([]);

  const handleFund = async () => {
    setFunding(true);
    setError('');
    try {
      const { order } = await milestoneApi.initiateFunding(milestone._id);
      const paymentResponse = await openRazorpayCheckout({
        orderId: order.id,
        amount: order.amount,
        name: 'Fanitt',
        description: `${milestone.title} — escrow`,
        prefillName: brandName,
      });
      await milestoneApi.verifyFunding(milestone._id, {
        razorpayOrderId: paymentResponse.razorpay_order_id,
        razorpayPaymentId: paymentResponse.razorpay_payment_id,
        razorpaySignature: paymentResponse.razorpay_signature,
      });
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setFunding(false);
    }
  };

  const handleSubmitWork = async (payload: { description: string; links: string[]; files: File[] }) => {
    setSubmitting(true);
    setError('');
    try {
      await milestoneApi.submitWork(milestone._id, payload);
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    setError('');
    try {
      await milestoneApi.approve(milestone._id);
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setApproving(false);
    }
  };

  const handleSendChangeRequest = async () => {
    if (!changeDescription.trim()) return;
    setRequestingChanges(true);
    setError('');
    try {
      await milestoneApi.requestChanges(milestone._id, {
        changeDescription: changeDescription.trim(),
        referenceLinks: changeLinks,
        files: changeFiles,
      });
      setActiveDecision('none');
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setRequestingChanges(false);
    }
  };

  const handleRaiseDispute = async () => {
    if (!disputeReason.trim()) return;
    setDisputing(true);
    setError('');
    try {
      await milestoneApi.raiseDispute(milestone._id, { reason: disputeReason.trim(), files: disputeFiles });
      setActiveDecision('none');
      onChanged();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setDisputing(false);
    }
  };

  if (locked) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-navy-800/30 p-4 opacity-60">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-white/30">
            <Lock size={13} />
          </span>
          <div>
            <p className="text-sm font-bold text-white/50">{milestone.title}</p>
            <p className="text-xs text-white/30">{formatRupees(milestone.amount)}</p>
          </div>
        </div>
        <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-bold text-white/40">Locked</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-navy-800/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-navy-900 text-xs font-bold text-white/60">
            {index + 1}
          </span>
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-white">
              {milestone.isAdvance && <Wallet size={13} className="text-orange-400" />}
              {milestone.title}
            </p>
            <p className="mt-0.5 text-lg font-bold text-orange-300">{formatRupees(milestone.amount)}</p>
          </div>
        </div>
        <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', MILESTONE_STATUS_STYLES[milestone.status])}>
          {MILESTONE_STATUS_LABEL[milestone.status]}
        </span>
      </div>

      {error && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          <AlertCircle size={13} className="shrink-0" /> {error}
        </div>
      )}

      {/* PENDING */}
      {isBrandOwner && milestone.status === 'pending' && (
        <div className="mt-3">
          <Button className="w-full justify-center" disabled={funding} onClick={handleFund}>
            {funding ? <Loader2 size={16} className="animate-spin" /> : `Fund ${formatRupees(milestone.amount)}`}
          </Button>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-white/40">
            <ShieldCheck size={12} className="shrink-0 text-teal-400" />
            This amount is held securely in Fanitt escrow — released to the creator only once you approve their work.
          </p>
        </div>
      )}
      {isAssignedCreator && milestone.status === 'pending' && (
        <p className="mt-3 text-xs text-white/50">Waiting for the brand to fund this milestone.</p>
      )}

      {/* FUNDED — creator submits */}
      {isBrandOwner && milestone.status === 'funded' && (
        <p className="mt-3 text-xs text-white/50">Waiting for the creator to submit work for this milestone.</p>
      )}
      {isAssignedCreator && milestone.status === 'funded' && (
        <SubmissionForm submitLabel="Submit work" submitting={submitting} onSubmit={handleSubmitWork} />
      )}

      {/* CHANGES_REQUESTED — creator sees the request + resubmits */}
      {isAssignedCreator && milestone.status === 'changes_requested' && (
        <div className="mt-3">
          <div className="rounded-2xl border border-orange-400/20 bg-orange-500/5 p-3">
            <p className="text-xs font-bold text-orange-300">Changes requested</p>
            <p className="mt-1 text-xs text-white/70">{milestone.changeDescription}</p>
            {(milestone.changeReferenceLinks || []).filter(Boolean).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-orange-300 hover:underline">
                {link}
              </a>
            ))}
            {(milestone.changeAttachments || []).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-orange-300 hover:underline">
                <Paperclip size={11} /> {a.name}
              </a>
            ))}
          </div>
          <SubmissionForm submitLabel="Resubmit work" submitting={submitting} onSubmit={handleSubmitWork} />
        </div>
      )}
      {isBrandOwner && milestone.status === 'changes_requested' && (
        <p className="mt-3 text-xs text-orange-300">You requested changes — waiting for the creator to resubmit.</p>
      )}

      {/* SUBMITTED — brand reviews with 3 options; creator sees their own submission */}
      {isBrandOwner && milestone.status === 'submitted' && (
        <div className="mt-3">
          <div className="rounded-2xl border border-white/10 bg-navy-900/40 p-3">
            <p className="text-xs font-bold text-white/80">Creator's submission</p>
            {milestone.submissionDescription && <p className="mt-1 text-xs text-white/70">{milestone.submissionDescription}</p>}
            {(milestone.submissionLinks || []).filter(Boolean).map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-orange-300 hover:underline">
                {link}
              </a>
            ))}
            {(milestone.submissionAttachments || []).map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1 text-xs text-orange-300 hover:underline">
                <Paperclip size={11} /> {a.name}
              </a>
            ))}
          </div>

          {milestone.autoReleaseAt && (
            <p className="mt-2 text-[11px] text-white/40">Auto-releases on {formatDate(milestone.autoReleaseAt)} if not reviewed.</p>
          )}

          {activeDecision === 'none' && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button disabled={approving} onClick={handleApprove} className="justify-center">
                {approving ? <Loader2 size={16} className="animate-spin" /> : 'Accept & Release'}
              </Button>
              <button
                onClick={() => setActiveDecision('changes')}
                className="rounded-full border border-orange-400/40 py-2.5 text-sm font-bold text-orange-300 hover:bg-orange-500/10"
              >
                Request Changes
              </button>
              <button
                onClick={() => setActiveDecision('dispute')}
                className="rounded-full border border-red-500/40 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/10"
              >
                Raise Dispute
              </button>
            </div>
          )}

          {activeDecision === 'changes' && (
            <div className="mt-3 space-y-2.5 rounded-2xl border border-orange-400/20 bg-orange-500/5 p-3">
              <textarea
                rows={2}
                value={changeDescription}
                onChange={(e) => setChangeDescription(e.target.value)}
                placeholder="What needs to change?"
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-400"
              />
              <input
                type="text"
                value={changeLinks[0]}
                onChange={(e) => setChangeLinks([e.target.value])}
                placeholder="Reference link (optional)"
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-orange-400"
              />
              <input
                type="file"
                multiple
                onChange={(e) => setChangeFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-1.5 text-[11px] text-white/70 file:mr-2 file:rounded-lg file:border-0 file:bg-orange-500/20 file:px-2.5 file:py-1 file:text-[10px] file:font-bold file:text-orange-300"
              />
              <div className="flex gap-2">
                <button onClick={() => setActiveDecision('none')} className="flex-1 rounded-full border border-white/15 py-2 text-xs font-semibold text-white/70">
                  Cancel
                </button>
                <button
                  onClick={handleSendChangeRequest}
                  disabled={requestingChanges || !changeDescription.trim()}
                  className="flex-1 rounded-full bg-orange-500 py-2 text-xs font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {requestingChanges ? <Loader2 size={14} className="mx-auto animate-spin" /> : 'Send to Creator'}
                </button>
              </div>
            </div>
          )}

          {activeDecision === 'dispute' && (
            <div className="mt-3 space-y-2.5 rounded-2xl border border-red-500/20 bg-red-500/5 p-3">
              <textarea
                rows={2}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Why doesn't this work match the brief?"
                className="w-full resize-none rounded-xl border border-white/10 bg-navy-800/70 px-3 py-2 text-xs text-white placeholder:text-white/30 focus:border-red-400"
              />
              <input
                type="file"
                multiple
                onChange={(e) => setDisputeFiles(Array.from(e.target.files || []))}
                className="w-full rounded-xl border border-white/10 bg-navy-800/70 px-3 py-1.5 text-[11px] text-white/70 file:mr-2 file:rounded-lg file:border-0 file:bg-red-500/20 file:px-2.5 file:py-1 file:text-[10px] file:font-bold file:text-red-300"
              />
              <div className="flex gap-2">
                <button onClick={() => setActiveDecision('none')} className="flex-1 rounded-full border border-white/15 py-2 text-xs font-semibold text-white/70">
                  Cancel
                </button>
                <button
                  onClick={handleRaiseDispute}
                  disabled={disputing || !disputeReason.trim()}
                  className="flex-1 rounded-full bg-red-500 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {disputing ? <Loader2 size={14} className="mx-auto animate-spin" /> : 'Raise Dispute'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {isAssignedCreator && milestone.status === 'submitted' && (
        <p className="mt-3 text-xs text-yellow-300">Waiting for the brand to review your submission.</p>
      )}

      {/* DISPUTED */}
      {milestone.status === 'disputed' && (
        <p className="mt-3 text-xs text-red-300">
          {isBrandOwner ? "You've raised a dispute on this milestone." : 'A dispute has been raised on this milestone.'} The
          Fanitt team is reviewing — you'll be notified once it's resolved.
        </p>
      )}

      {/* RELEASED */}
      {milestone.status === 'released' && (
        <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-300">
          <Check size={13} /> {isAssignedCreator ? 'Paid' : `Released${milestone.releasedAt ? ' on ' + formatDate(milestone.releasedAt) : ''}`}
        </p>
      )}
    </div>
  );
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<ApiCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated, user } = useAppSelector((s) => s.auth);

  const [applyModalOpen, setApplyModalOpen] = useState(false);

  // `applied` = the creator already has a proposal on this campaign,
  // whether that happened just now in this session (set after a
  // successful submit) or was found on page load (see the
  // "already applied?" check below, via getMyProposals — the campaign
  // object itself carries no per-viewer "did I apply" flag). While that
  // check is in flight we hide the Apply button to avoid a flash of the
  // wrong state, tracked by `checkingApplied`.
  const [applied, setApplied] = useState(false);
  const [checkingApplied, setCheckingApplied] = useState(true);

  const [milestones, setMilestones] = useState<ApiMilestone[]>([]);
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

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

  // Already-applied check — only matters for creators. Pulls the
  // creator's own proposals and checks whether one already points at
  // this campaign, so a page reload/fresh visit shows "Applied" instead
  // of letting them try (and fail) to apply again.
  useEffect(() => {
    if (!id || !user || user.role !== 'creator') {
      setCheckingApplied(false);
      return;
    }
    setCheckingApplied(true);
    campaignApi
      .getMyProposals()
      .then(({ proposals }) => {
        if (proposals.some((p) => p.campaign._id === id)) setApplied(true);
      })
      .catch(() => {})
      .finally(() => setCheckingApplied(false));
  }, [id, user]);

  useEffect(() => {
    if (!id || !user) return;
    const key = `fanitt_reviewed_${id}_${user._id}`;
    if (localStorage.getItem(key) === 'true') setReviewDone(true);
  }, [id, user]);

  const markReviewed = () => {
    if (id && user) localStorage.setItem(`fanitt_reviewed_${id}_${user._id}`, 'true');
    setReviewDone(true);
    setReviewModalOpen(false);
  };

  const isBrandOwner = campaign && user?.role === 'brand' && campaign.brand.user._id === user._id;
  const isAssignedCreator = campaign?.assignedCreator?.user._id === user?._id;
  const canApply = user?.role === 'creator' && campaign?.status === 'open' && !campaign?.assignedCreator;
  // A campaign someone else already got accepted for — separate from
  // canApply so the page can show a clear reason instead of just quietly
  // not offering the Apply button.
  const isAlreadyAllotted = Boolean(campaign?.assignedCreator) && !isAssignedCreator;

  // Milestones only exist for paid campaigns with an assigned creator —
  // and only the brand owner or the assigned creator can see them.
  const loadMilestones = () => {
    if (!id || !campaign || campaign.campaignType !== 'paid' || !campaign.assignedCreator) return;
    if (!isBrandOwner && !isAssignedCreator) return;
    setMilestonesLoading(true);
    milestoneApi
      .getForCampaign(id)
      .then(setMilestones)
      .catch(() => setMilestones([]))
      .finally(() => setMilestonesLoading(false));
  };

  useEffect(loadMilestones, [id, campaign?.assignedCreator, isBrandOwner, isAssignedCreator]);

  const openApplyModal = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/campaigns/${id}` } });
      return;
    }
    setApplyModalOpen(true);
  };

  const handleMilestoneChanged = () => {
    loadMilestones();
    load(); // refresh campaign status too (e.g. moves to in_progress / completed)
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

  const hasDeliverables = campaign.deliverables && (campaign.deliverables.reel || campaign.deliverables.story || campaign.deliverables.post);
  const hasProducts = campaign.products && campaign.products.length > 0;
  const hasSampleMedia = campaign.sampleMedia && campaign.sampleMedia.length > 0;
  const hasRequirements = Boolean(
    campaign.minFollowers || campaign.ageRange || campaign.genderTarget?.length > 0 || campaign.influencerCategories?.length > 0
  );
  const descriptionIsLong = campaign.description.length > DESCRIPTION_TRUNCATE_LENGTH;
  const showApplyAction = !checkingApplied && (canApply || applied);
  const showStickyApplyBar = !checkingApplied && canApply && !applied;
  // Shown instead of the Apply card when a creator (who hasn't applied
  // themselves) opens a campaign that already has an accepted creator —
  // previously this case just fell through to nothing being shown at
  // the bottom of the page, with no explanation.
  const showAllottedNotice = !checkingApplied && user?.role === 'creator' && !applied && isAlreadyAllotted && campaign.status === 'open';
  const hasBothDosDonts = campaign.dos?.length > 0 && campaign.donts?.length > 0;

  // Quick-facts sidebar card — budget/duration/location/applied +
  // deliverables + brand's "view applicants" + escrow note + posted
  // date. No Apply button here — that's its own section at the very
  // bottom of the page (see applyCard below).
  const factsCard = (
    <div className="rounded-[28px] border border-white/10 bg-navy-800/50 p-5">
      <div className="divide-y divide-white/5">
        <QuickFactRow
          icon={<Briefcase size={14} />}
          label={campaign.campaignType === 'paid' ? 'Budget' : 'Products'}
          value={
            campaign.campaignType === 'paid'
              ? formatRupees(campaign.budget)
              : `${campaign.products.length} item${campaign.products.length === 1 ? '' : 's'}`
          }
        />
        <QuickFactRow icon={<Clock size={14} />} label="Duration" value={campaign.durationLabel || 'Flexible'} />
        <QuickFactRow icon={<MapPin size={14} />} label="Location" value={campaign.location} />
        <QuickFactRow icon={<Instagram size={14} />} label="Applied" value={campaign.applicantCount} />
      </div>

      {hasDeliverables && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/5 pt-4">
          <DeliverableChip count={campaign.deliverables.reel} label="Reel" />
          <DeliverableChip count={campaign.deliverables.story} label="Story" />
          <DeliverableChip count={campaign.deliverables.post} label="Post" />
        </div>
      )}

      {isBrandOwner && campaign.status === 'open' && (
        <Link to={`/campaigns/${id}/applications`} className="mt-4 block">
          <Button className="w-full justify-center" variant="outline">
            View {campaign.applicantCount} applicant{campaign.applicantCount === 1 ? '' : 's'}
          </Button>
        </Link>
      )}

      {campaign.campaignType === 'paid' && (
        <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-teal-500/15 bg-teal-500/5 px-3.5 py-3">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-400" />
          <p className="text-xs leading-relaxed text-teal-200/90">
            Payout held securely in escrow, released one milestone at a time as each is approved.
          </p>
        </div>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs text-white/35">
        <Calendar size={12} /> Posted on {formatDate(campaign.createdAt)}
      </p>
    </div>
  );

  // Sample media card — adaptive grid (1 = full tile, 2 = split,
  // 3 = big + two small) — sits right under the facts card so it fills
  // the sidebar's leftover height instead of leaving it blank.
  const sampleMediaCard = hasSampleMedia && (
    <div className="rounded-[28px] border border-white/10 bg-navy-800/50 p-5">
      <SectionHeading icon={<ImagePlus size={14} />}>Sample media</SectionHeading>
      <SampleMediaGrid media={campaign.sampleMedia} onExpand={setLightboxUrl} />
    </div>
  );

  // Apply CTA — deliberately its own last section on the page (after
  // brief, requirements, milestones and even the completed-review
  // block), same position on desktop and mobile, so it never gets lost
  // mid-page inside the sidebar.
  // Shown in place of the Apply card once someone else has already been
  // accepted for this campaign — a clear reason instead of the section
  // just silently disappearing.
  const allottedNoticeCard = showAllottedNotice && (
    <section className="mt-8 border-t border-white/10 pt-8">
      <div className="rounded-[28px] border border-white/10 bg-navy-800/50 p-6 text-center sm:p-8">
        <h3 className="text-lg font-bold text-white">Campaign already booked</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-white/50">
          {campaign.brand.companyName} has already accepted a creator for this campaign, so it's no longer accepting new proposals.
        </p>
      </div>
    </section>
  );

  const applyCard = showApplyAction && (
    <section className="mt-8 border-t border-white/10 pt-8">
      <div className="rounded-[28px] border border-white/10 bg-navy-800/50 p-6 text-center sm:p-8">
        <h3 className="text-lg font-bold text-white">{applied ? "You're in!" : 'Ready to apply?'}</h3>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-white/50">
          {applied
            ? 'Your proposal has been sent for this opportunity — track it under My Proposals.'
            : `Send your proposal and ${campaign.brand.companyName} will get back to you.`}
        </p>
        <button
          type="button"
          disabled={applied}
          aria-disabled={applied}
          onClick={applied ? undefined : openApplyModal}
          className={cn(
            'mx-auto mt-5 flex w-full max-w-sm items-center justify-center gap-2 rounded-2xl py-4 text-sm font-bold transition-all',
            applied
              ? 'cursor-not-allowed bg-emerald-500/15 text-emerald-300'
              : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 hover:shadow-orange-500/30'
          )}
        >
          {applied ? (
            <>
              <Check size={16} /> Applied
            </>
          ) : (
            'Apply to this opportunity'
          )}
        </button>
      </div>
    </section>
  );

  return (
    <div className={cn('pt-24 sm:pt-28', showStickyApplyBar ? 'pb-32 sm:pb-16' : 'pb-16')}>
      <Container className="max-w-6xl">
        <Link to="/campaigns" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-orange-400">
          <ArrowLeft size={15} /> Back to campaigns
        </Link>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mt-4">
          {/* HERO — banner + brand avatar + title only. Budget/duration/
              location/applicants live in the facts sidebar; the Apply
              button lives at the very bottom. */}
          <div className="overflow-hidden rounded-[28px] border border-white/10 bg-navy-800/50">
            <div className="relative h-44 w-full overflow-hidden bg-navy-700 sm:h-56">
              {campaign.campaignImageUrl ? (
                <img src={campaign.campaignImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-navy-700 to-navy-900 text-white/15">
                  <ImagePlus size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/40 to-transparent" />

              <span
                className={cn(
                  'absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold text-white',
                  campaign.campaignType === 'paid' ? 'bg-emerald-500' : 'bg-purple-500'
                )}
              >
                {campaign.campaignType === 'paid' ? 'Paid campaign' : 'Barter campaign'}
              </span>

              {campaign.campaignImageUrl && (
                <button
                  type="button"
                  onClick={() => setLightboxUrl(campaign.campaignImageUrl)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                  aria-label="View full image"
                >
                  <Maximize2 size={14} />
                </button>
              )}
            </div>

            <div className="relative -mt-9 px-5 pb-6 sm:px-7">
              <div className="flex items-end justify-between gap-3">
                <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-navy-800 bg-navy-700 sm:h-[76px] sm:w-[76px]">
                  {campaign.brand.logoUrl ? (
                    <img src={campaign.brand.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Building2 size={22} className="text-white/30" />
                  )}
                </div>
                {campaign.visibilityTier === 'exclusive' && (
                  <span className="mb-1.5 flex shrink-0 items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[10px] font-bold text-orange-300">
                    <Sparkles size={10} /> Pro exclusive
                  </span>
                )}
              </div>

              <div className="mt-3">
                {campaign.brand.slug ? (
                  <Link
                    to={`/brand/${campaign.brand.slug}`}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-white/60 hover:text-orange-300"
                  >
                    {campaign.brand.companyName} <ExternalLink size={11} className="shrink-0" />
                  </Link>
                ) : (
                  <p className="text-sm font-semibold text-white/60">{campaign.brand.companyName}</p>
                )}
                <h1 className="mt-1 text-2xl font-bold leading-tight text-white sm:text-[28px]">{campaign.title}</h1>
              </div>

              {campaign.category?.label && (
                <span className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/60">
                  {campaign.category.label}
                </span>
              )}
            </div>
          </div>

          {/* Mobile: facts card + sample media stack right under the hero,
              above the brief. */}
          <div className="mt-6 space-y-6 lg:hidden">
            {factsCard}
            {sampleMediaCard}
          </div>

          {/* Two-column body: brief/requirements/milestones/dos-donts on
              the left, sticky facts + sample-media sidebar on the right. */}
          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              {/* Brief */}
              <section>
                <SectionHeading icon={<FileText size={14} />}>The brief</SectionHeading>
                <p className={cn('leading-relaxed text-white/70', !descExpanded && descriptionIsLong && 'line-clamp-4')}>
                  {campaign.description}
                </p>
                {descriptionIsLong && (
                  <button
                    onClick={() => setDescExpanded((v) => !v)}
                    className="mt-2 flex items-center gap-1 text-sm font-semibold text-orange-400 hover:underline"
                  >
                    {descExpanded ? 'Show less' : 'Read more'}
                    <ChevronDown size={14} className={cn('transition-transform', descExpanded && 'rotate-180')} />
                  </button>
                )}
              </section>

              {/* Who brands are looking for */}
              {hasRequirements && (
                <section>
                  <SectionHeading icon={<Users2 size={14} />}>Who they're looking for</SectionHeading>
                  <div className="flex flex-wrap gap-2">
                    {campaign.minFollowers ? <RequirementChip>{campaign.minFollowers.toLocaleString('en-IN')}+ followers</RequirementChip> : null}
                    <RequirementChip>
                      Age {campaign.ageRange.min}–{campaign.ageRange.max}
                    </RequirementChip>
                    {campaign.genderTarget?.length > 0 && (
                      <RequirementChip>{campaign.genderTarget.map((g) => g[0].toUpperCase() + g.slice(1)).join(' · ')}</RequirementChip>
                    )}
                    {campaign.influencerCategories?.map((c) => (
                      <RequirementChip key={c} accent>
                        {c}
                      </RequirementChip>
                    ))}
                  </div>
                </section>
              )}

              {/* How you'll get paid */}
              {campaign.campaignType === 'paid' && campaign.milestoneCount && campaign.milestoneCount > 0 && (
                <section>
                  <SectionHeading icon={<Layers size={14} />}>How you'll get paid</SectionHeading>
                  <div className="rounded-2xl border border-white/10 bg-navy-800/40 p-5">
                    <div className="relative">
                      <div className="absolute bottom-2 left-[15px] top-2 w-px bg-white/10" />
                      <div className="space-y-5">
                        {Array.from({ length: campaign.milestoneCount }).map((_, i) => {
                          const count = campaign.milestoneCount!;
                          const perMilestone = Math.floor(campaign.budget / count);
                          const remainder = campaign.budget - perMilestone * count;
                          const amount = perMilestone + (i === count - 1 ? remainder : 0);
                          const percent = Math.round((amount / campaign.budget) * 100);
                          const title = campaign.milestoneTitles?.[i]?.trim() || (count === 1 ? 'Full payment' : `Milestone ${i + 1}`);
                          return (
                            <div key={i} className="relative flex items-start gap-4">
                              <span className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-navy-900 text-xs font-bold text-white/60">
                                {i + 1}
                              </span>
                              <div className="flex flex-1 items-center justify-between gap-3 pt-1">
                                <div>
                                  <p className="text-sm font-semibold text-white">{title}</p>
                                  <p className="text-xs text-white/40">{percent}% of budget</p>
                                </div>
                                <p className="text-sm font-bold text-orange-300">{formatRupees(amount)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                      <p className="font-bold text-white">Total</p>
                      <p className="font-bold text-white">{formatRupees(campaign.budget)}</p>
                    </div>
                    <p className="mt-3 text-xs text-white/40">Each milestone unlocks once the one before it is approved and released.</p>
                  </div>
                </section>
              )}

              {/* Do's & Don'ts — 2-column only when both exist, else a
                  single full-width card, so there's never a blank second
                  column. */}
              {(campaign.dos?.length > 0 || campaign.donts?.length > 0) && (
                <section className={cn('grid grid-cols-1 gap-3', hasBothDosDonts && 'sm:grid-cols-2')}>
                  {campaign.dos?.length > 0 && (
                    <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/5 p-4">
                      <p className="mb-3 text-sm font-bold text-emerald-300">Do</p>
                      <ul className="space-y-2.5">
                        {campaign.dos.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                            <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {campaign.donts?.length > 0 && (
                    <div className="rounded-2xl border border-red-500/15 bg-red-500/5 p-4">
                      <p className="mb-3 text-sm font-bold text-red-300">Don't</p>
                      <ul className="space-y-2.5">
                        {campaign.donts.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-white/70">
                            <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" /> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </section>
              )}

              {/* Products */}
              {hasProducts && (
                <section>
                  <SectionHeading icon={<Gift size={14} />}>
                    {campaign.campaignType === 'barter' ? 'Barter products' : 'Free products'}
                  </SectionHeading>
                  <div className="flex flex-wrap gap-3">
                    {campaign.products.map((p) => (
                      <div key={p._id} className="w-24 rounded-2xl border border-white/10 bg-navy-800/45 p-2.5 text-center">
                        {p.imageUrl ? (
                          <ExpandableImage src={p.imageUrl} className="h-16 w-full rounded-xl object-cover" onExpand={setLightboxUrl} roundedClassName="rounded-xl" />
                        ) : (
                          <div className="flex h-16 w-full items-center justify-center rounded-xl bg-white/10 text-white/30">
                            <ImagePlus size={16} />
                          </div>
                        )}
                        <p className="mt-1.5 truncate text-[10px] font-semibold text-white/70">{p.name}</p>
                        <p className="text-[10px] text-white/40">Qty {p.quantity}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {error && (
                <div className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  <AlertCircle size={16} className="shrink-0" /> {error}
                </div>
              )}
            </div>

            {/* Sticky sidebar — desktop only (mobile copy already rendered
                above, under the hero). Facts card + sample media stack. */}
            <div className="hidden lg:col-span-1 lg:block">
              <div className="sticky top-28 space-y-6">
                {factsCard}
                {sampleMediaCard}
              </div>
            </div>
          </div>

          {/* Interactive payment milestones — needs full width for the
              funding/submission/review forms. */}
          {(isBrandOwner || isAssignedCreator) && campaign.campaignType === 'paid' && campaign.assignedCreator && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h3 className="mb-3 text-sm font-bold text-white">Payment milestones</h3>
              {milestonesLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={20} className="animate-spin text-white/40" />
                </div>
              ) : milestones.length === 0 ? (
                <p className="text-sm text-white/50">Milestones will appear here once set up.</p>
              ) : (
                <div className="space-y-3">
                  {/* Sequential unlock: the first non-released milestone
                      (by order) is the only interactive one — everything
                      after it renders as "Locked" until it clears. */}
                  {(() => {
                    const firstUnreleasedIndex = milestones.findIndex((m) => m.status !== 'released');
                    return milestones.map((m, i) => (
                      <MilestoneCard
                        key={m._id}
                        milestone={m}
                        index={i}
                        locked={firstUnreleasedIndex !== -1 && i > firstUnreleasedIndex}
                        isBrandOwner={Boolean(isBrandOwner)}
                        isAssignedCreator={Boolean(isAssignedCreator)}
                        brandName={campaign.brand.companyName}
                        onChanged={handleMilestoneChanged}
                      />
                    ));
                  })()}
                </div>
              )}
            </div>
          )}

          {campaign.status === 'completed' && (
            <div className="mt-8 space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center justify-center gap-2 rounded-2xl bg-teal-500/15 py-3.5 text-sm font-bold text-teal-300">
                <Check size={16} /> Completed — payment released to the creator.
              </div>
              {(isBrandOwner || isAssignedCreator) && !reviewDone && (
                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-orange-400/40 py-3 text-sm font-bold text-orange-300 hover:bg-orange-500/10"
                >
                  Leave a review for {isBrandOwner ? campaign.assignedCreator?.user.name : campaign.brand.companyName}
                </button>
              )}
              {reviewDone && <p className="text-center text-xs text-white/40">Thanks for your review.</p>}
            </div>
          )}

          {/* Apply — always last, both desktop and mobile. */}
          {applyCard}
          {allottedNoticeCard}
        </motion.div>
      </Container>

      {/* Mobile sticky apply bar — floating quick-access while scrolling,
          separate from the full Apply section at the bottom. */}
      {showStickyApplyBar && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-navy-900/95 p-3 backdrop-blur-lg sm:hidden">
          <Container className="max-w-6xl">
            <button
              type="button"
              onClick={openApplyModal}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
            >
              Apply to this opportunity
            </button>
          </Container>
        </div>
      )}

      {campaign && (
        <ApplyModal
          open={applyModalOpen}
          onClose={() => setApplyModalOpen(false)}
          campaign={campaign}
          onSubmitted={() => {
            setApplyModalOpen(false);
            setApplied(true);
            // Brief pause so the "Applied" state is visible for a moment
            // before jumping to My Proposals — same pattern as
            // PostCampaign's post-publish redirect.
            setTimeout(() => navigate('/proposals'), 1200);
          }}
        />
      )}

      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxUrl(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxUrl(null)}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X size={20} />
            </button>
            {isVideoUrl(lightboxUrl!) ? (
              <video
                src={lightboxUrl!}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <motion.img
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                src={lightboxUrl!}
                alt=""
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {campaign && (isBrandOwner || isAssignedCreator) && (
        <ReviewModal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          revieweeName={isBrandOwner ? campaign.assignedCreator?.user.name || 'the creator' : campaign.brand.companyName}
          payload={{
            toUser: isBrandOwner ? campaign.assignedCreator?.user._id || '' : campaign.brand.user._id,
            relatedModel: 'Campaign',
            relatedId: campaign._id,
          }}
          onSubmitted={markReviewed}
          onAlreadyReviewed={markReviewed}
        />
      )}
    </div>
  );
}